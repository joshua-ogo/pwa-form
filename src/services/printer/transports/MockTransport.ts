import type { PrinterTransport } from '../../../types/printer';
import { TransportType } from '../../../types/printer';

/**
 * MockTransport
 * A virtual printer that logs data to the console instead of sending to hardware.
 * Perfect for debugging encoding and layout without wasting paper.
 */
export class MockTransport implements PrinterTransport {
  type = TransportType.Mock;
  name = "Virtual Debug Printer";

  async connect(): Promise<void> {
    console.log("%c[Printer] Simulating Connection...", "color: #2196F3; font-weight: bold;");
    // Simulate a short network/hardware delay
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log("%c[Printer] Connected to Virtual Device!", "color: #4CAF50; font-weight: bold;");
  }

  async write(data: Uint8Array): Promise<void> {
    console.log("%c[Printer] Receiving Data Packet...", "color: #FF9800; font-weight: bold;");
    
    // Convert bytes to Hex string so you can verify ESC/POS commands
    const hexString = Array.from(data)
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    // Convert bytes back to string to see the actual text
    // Note: This won't show control characters clearly, but helps with text
    const text = new TextDecoder().decode(data);

    console.group("🖨️ Virtual Print Job");
    console.log(`%c[Raw Hex]: %c${hexString}`, "font-weight: bold;", "color: #666; font-family: monospace;");
    console.log(`%c[Decoded Text]:\n%c${text}`, "font-weight: bold;", "color: #333; font-family: monospace; white-space: pre-wrap;");
    console.groupEnd();
  }

  async disconnect(): Promise<void> {
    console.log("%c[Printer] Disconnected.", "color: #F44336; font-weight: bold;");
  }
}
