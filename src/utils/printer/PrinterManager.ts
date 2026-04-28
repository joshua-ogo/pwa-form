import { PrinterStatus, TransportType } from '../../types/printer';
import type { PrinterTransport, SubmissionData } from '../../types/printer';
import { SerialTransport } from './SerialTransport';
import { BluetoothTransport } from './BluetoothTransport';
import { ESCFormatter } from './ESCFormatter';

export class PrinterManager {
  private static instance: PrinterManager;
  private transport: PrinterTransport | null = null;
  private status: PrinterStatus = PrinterStatus.Disconnected;
  private listeners: ((status: PrinterStatus) => void)[] = [];

  private constructor() {
    // Check for previously connected printer
    const lastType = localStorage.getItem('last_printer_type');
    if (lastType && Object.values(TransportType).includes(lastType as TransportType)) {
      console.log(`Last printer was ${lastType}. Ready for quick reconnect.`);
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

  async connect(type: TransportType, deviceId?: string): Promise<void> {
    if (this.transport) {
      await this.disconnect();
    }

    this.setStatus(PrinterStatus.Connecting);
    
    try {
      this.transport = type === TransportType.Serial 
        ? new SerialTransport() 
        : new BluetoothTransport();
      
      if (this.transport instanceof BluetoothTransport) {
        await this.transport.connect(deviceId);
        // Persist metadata
        const devices = await (navigator as any).bluetooth.getDevices();
        const device = devices.find((d: any) => d.name === this.transport?.name);
        if (device) {
          localStorage.setItem('last_device_id', device.id);
          localStorage.setItem('last_device_name', device.name);
        }
      } else {
        await this.transport.connect();
      }

      localStorage.setItem('last_printer_type', type);
      this.setStatus(PrinterStatus.Ready);
    } catch (err) {
      this.setStatus(PrinterStatus.Error);
      throw err;
    }
  }

  async testConnection(): Promise<void> {
    if (!this.transport) throw new Error('No printer connected');
    
    this.setStatus(PrinterStatus.Busy);
    try {
      // Standard ESC/POS test pulse or just a simple status check
      // For now, we'll just send a small "READY" print
      const bytes = ESCFormatter.formatTestPrint();
      await this.transport.write(bytes);
      this.setStatus(PrinterStatus.Ready);
    } catch (err) {
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

  async printSubmission(data: SubmissionData): Promise<void> {
    if (!this.transport || (this.status !== PrinterStatus.Connected && this.status !== PrinterStatus.Ready)) {
      throw new Error('Printer not ready.');
    }

    this.setStatus(PrinterStatus.Printing);
    try {
      const bytes = ESCFormatter.formatReceipt(data);
      await this.transport.write(bytes);
      this.setStatus(PrinterStatus.Success);
      // Revert to Ready after 2 seconds
      setTimeout(() => this.setStatus(PrinterStatus.Ready), 2000);
    } catch (err) {
      this.setStatus(PrinterStatus.Failed);
      setTimeout(() => this.setStatus(PrinterStatus.Ready), 3000);
      throw err;
    }
  }

  isSupported(type: TransportType): boolean {
    if (type === TransportType.Serial) return 'serial' in navigator;
    if (type === TransportType.Bluetooth) return 'bluetooth' in navigator;
    return false;
  }
}
