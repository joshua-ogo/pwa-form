import type { PrinterTransport } from '../../types/printer';
import { TransportType } from '../../types/printer';

export class SerialTransport implements PrinterTransport {
  type = TransportType.Serial;
  name: string | null = 'Serial Printer';
  private port: any = null;
  private writer: WritableStreamDefaultWriter | null = null;

  async connect(_deviceId?: string): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported in this browser.');
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 9600 });
      this.writer = this.port.writable.getWriter();
    } catch (err) {
      if (err instanceof Error && err.name === 'NotFoundError') {
        throw new Error('No serial port selected.');
      }
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.writer) {
      this.writer.releaseLock();
      this.writer = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.writer) throw new Error('Printer not connected.');
    await this.writer.write(data);
  }
}
