import type { PrinterTransport } from '../../types/printer';
import { TransportType } from '../../types/printer';

// Using any for Bluetooth types to avoid missing type definition errors in build
export class BluetoothTransport implements PrinterTransport {
  type = TransportType.Bluetooth;
  name: string | null = null;
  private device: any = null;
  private characteristic: any = null;

  async connect(deviceId?: string): Promise<void> {
    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth API not supported in this browser.');
    }

    try {
      if (deviceId && 'getDevices' in (navigator as any).bluetooth) {
        // Try to find previously approved device
        const devices = await (navigator as any).bluetooth.getDevices();
        this.device = devices.find((d: any) => d.id === deviceId);
        if (!this.device) throw new Error('Previously paired device not found.');
      } else {
        // Request new device
        this.device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          filters: [
            { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
            { services: ['49535343-fe7d-41aa-83b1-d10935904914'] },
            { services: ['e7e11001-4954-4152-a50e-00163e720315'] }
          ],
          // optionalServices: [
          //   '000018f0-0000-1000-8000-00805f9b34fb', 
          //   '49535343-fe7d-41aa-83b1-d10935904914',
          //   'e7e11001-4954-4152-a50e-00163e720315',
          //   '0000ff00-0000-1000-8000-00805f9b34fb'
          // ]
        });
      }

      this.name = this.device.name || 'Generic Printer';
      const server = await this.device.gatt?.connect();
      if (!server) throw new Error('GATT Server not available.');

      // Try to find the write characteristic across all services
      const services = await server.getPrimaryServices();
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          const writeChar = characteristics.find((c: any) => 
            c.properties.write || 
            c.properties.writeWithoutResponse
          );
          if (writeChar) {
            this.characteristic = writeChar;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!this.characteristic) {
        throw new Error('No writeable characteristic found. Device may be incompatible.');
      }

    } catch (err) {
      this.name = null;
      if (err instanceof Error && err.name === 'NotFoundError') {
        throw new Error('No device selected.');
      }
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.characteristic) throw new Error('Printer not connected.');

    const MTU = 20;
    for (let i = 0; i < data.length; i += MTU) {
      const chunk = data.slice(i, i + MTU);
      // Prefer the explicit method if available
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValueWithResponse(chunk);
      }
      // Add a tiny delay to prevent overwhelming the printer's buffer
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}
