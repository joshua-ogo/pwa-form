import { PrinterStatus, TransportType } from '../../types/printer';
import type { PrinterTransport } from '../../types/printer';
import type { ReceiptData } from '../../types/receipt';
import { receiptFormatter } from './receiptFormatter';
import { receiptEncoder } from './receiptEncoder';
import { BluetoothTransport } from '../../utils/printer/BluetoothTransport';
import { SerialTransport } from '../../utils/printer/SerialTransport';
import { MockTransport } from './transports/MockTransport';

/**
 * PrinterManager (Refactored)
 * Coordinates the flow: App Data -> Formatter -> Encoder -> Transport.
 * Treats transport as a modular plug-in.
 */
export class PrinterManager {
  private static instance: PrinterManager;
  private transport: PrinterTransport | null = null;
  private status: PrinterStatus = PrinterStatus.Disconnected;
  private listeners: ((status: PrinterStatus) => void)[] = [];

  private constructor() {
    const lastType = localStorage.getItem('last_printer_type');
    if (lastType && Object.values(TransportType).includes(lastType as TransportType)) {
      console.log(`[PrinterManager] Last transport was ${lastType}.`);
    }
  }

  static getInstance(): PrinterManager {
    if (!PrinterManager.instance) {
      PrinterManager.instance = new PrinterManager();
    }
    return PrinterManager.instance;
  }

  getStatus(): PrinterStatus {
    return this.status;
  }

  getActiveDeviceName(): string | null {
    if (this.transport instanceof BluetoothTransport) {
      return this.transport.name;
    }
    return localStorage.getItem('last_device_name');
  }

  async getKnownDevices(): Promise<{ id: string; name: string }[]> {
    if ('bluetooth' in navigator && 'getDevices' in (navigator as any).bluetooth) {
      const devices = await (navigator as any).bluetooth.getDevices();
      return devices.map((d: any) => ({ id: d.id, name: d.name || 'Generic Printer' }));
    }
    
    // Fallback to localStorage metadata if API not available
    const lastId = localStorage.getItem('last_device_id');
    const lastName = localStorage.getItem('last_device_name');
    if (lastId && lastName) {
      return [{ id: lastId, name: lastName }];
    }
    
    return [];
  }

  subscribe(listener: (status: PrinterStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private setStatus(newStatus: PrinterStatus) {
    this.status = newStatus;
    this.listeners.forEach(l => l(newStatus));
  }

  /**
   * Connects to a hardware transport.
   */
  async connect(type: TransportType, deviceId?: string): Promise<void> {
    if (this.transport) await this.disconnect();

    this.setStatus(PrinterStatus.Connecting);
    
    try {
      if (type === TransportType.Serial) {
        this.transport = new SerialTransport();
      } else if (type === TransportType.Bluetooth) {
        this.transport = new BluetoothTransport();
      } else if (type === TransportType.Mock) {
        this.transport = new MockTransport();
      } else {
        throw new Error('Unsupported transport type');
      }
      
      await this.transport.connect(deviceId);
      
      localStorage.setItem('last_printer_type', type);
      this.setStatus(PrinterStatus.Ready);
    } catch (err) {
      this.transport = null;
      this.setStatus(PrinterStatus.Error);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.disconnect();
      this.transport = null;
    }
    localStorage.removeItem('last_printer_type');
    this.setStatus(PrinterStatus.Disconnected);
  }

  /**
   * The new modular print flow.
   * Data -> Formatter -> Encoder -> Active Transport
   */
  async print(data: ReceiptData): Promise<void> {
    if (!this.transport || this.status === PrinterStatus.Disconnected) {
      throw new Error('No printer connected.');
    }

    this.setStatus(PrinterStatus.Printing);

    try {
      // 1. Format: Map app data to structured model
      const model = receiptFormatter.format(data);
      
      // 2. Encode: Turn model into ESC/POS bytes
      const bytes = receiptEncoder.encode(model);
      
      // 3. Transport: Send bytes to hardware
      await this.transport.write(bytes);

      this.setStatus(PrinterStatus.Success);
      setTimeout(() => this.setStatus(PrinterStatus.Ready), 2000);
    } catch (err) {
      console.error('[PrinterManager] Print failed:', err);
      this.setStatus(PrinterStatus.Failed);
      setTimeout(() => this.setStatus(PrinterStatus.Ready), 3000);
      throw err;
    }
  }

  /**
   * Diagnostic test print.
   */
  async testConnection(): Promise<void> {
    if (!this.transport) throw new Error('No printer connected');
    
    this.setStatus(PrinterStatus.Busy);
    try {
      const testData: ReceiptData = {
        fullName: "TEST CUSTOMER",
        email: "test@example.com",
        phone: "555-0199",
        address: "123 Test St, Tech City",
        notes: "This is a diagnostic test print of the new modular architecture.",
        timestamp: new Date().toISOString(),
        referenceId: "TEST-01"
      };
      
      const model = receiptFormatter.format(testData);
      const bytes = receiptEncoder.encode(model);
      await this.transport.write(bytes);
      
      this.setStatus(PrinterStatus.Ready);
    } catch (err) {
      this.setStatus(PrinterStatus.Error);
      throw err;
    }
  }

  /**
   * Quick utility to get a text preview of what will be printed.
   */
  getPreview(data: ReceiptData): string {
    const model = receiptFormatter.format(data);
    return receiptFormatter.generatePreview(model);
  }

  isSupported(type: TransportType): boolean {
    if (type === TransportType.Serial) return 'serial' in navigator;
    if (type === TransportType.Bluetooth) return 'bluetooth' in navigator;
    if (type === TransportType.Mock) return true;
    return false;
  }
}
