import type { SubmissionData } from '../../types/printer';

/**
 * ESCFormatter
 * Utility for generating ESC/POS command bytes for thermal printers.
 */
export class ESCFormatter {
  private static ESC = 0x1B;
  private static GS = 0x1D;

  private static RESET = new Uint8Array([ESCFormatter.ESC, 0x40]);
  private static CENTER = new Uint8Array([ESCFormatter.ESC, 0x61, 0x01]);
  private static LEFT = new Uint8Array([ESCFormatter.ESC, 0x61, 0x00]);
  private static BOLD_ON = new Uint8Array([ESCFormatter.ESC, 0x45, 0x01]);
  private static BOLD_OFF = new Uint8Array([ESCFormatter.ESC, 0x45, 0x00]);
  private static DOUBLE_SIZE = new Uint8Array([ESCFormatter.GS, 0x21, 0x11]);
  private static NORMAL_SIZE = new Uint8Array([ESCFormatter.GS, 0x21, 0x00]);

  static formatReceipt(data: SubmissionData): Uint8Array {
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];

    const add = (bytes: Uint8Array | string) => {
      chunks.push(typeof bytes === 'string' ? encoder.encode(bytes) : bytes);
    };

    const hr = "--------------------------------\n";

    add(this.RESET);
    add(this.CENTER);
    
    add(this.DOUBLE_SIZE);
    add(this.BOLD_ON);
    add("MIDNIGHT INTAKE\n");
    add(this.NORMAL_SIZE);
    add("PREMIUM POS SYSTEM\n");
    add(hr);
    add(this.BOLD_OFF);
    
    const date = new Date(data.timestamp);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    const ref = date.getTime().toString().slice(-6);

    add(`DATE: ${dateStr}\n`);
    add(`TIME: ${timeStr}\n`);
    add(`REF: #${ref}\n`);
    add(hr);

    add(this.LEFT);
    
    const addField = (label: string, value: string) => {
      add(this.BOLD_ON);
      add(`${label}:\n`);
      add(this.BOLD_OFF);
      add(`${value}\n\n`);
    };

    addField("FULL NAME", data.fullName);
    addField("EMAIL", data.email);

    if (data.phone) addField("PHONE", data.phone);
    if (data.address) addField("ADDRESS", data.address);
    if (data.notes) addField("NOTES", data.notes);

    add(hr);
    add(this.CENTER);
    add(this.BOLD_ON);
    add("THANK YOU FOR YOUR VISIT\n");
    add(this.NORMAL_SIZE);
    add("WWW.MIDNIGHT-INTAKE.COM\n");
    add(this.RESET);
    
    add("\n\n\n\n\n"); // Extra padding for cutting

    return this.combineChunks(chunks);
  }

  static formatTestPrint(): Uint8Array {
    const chunks: Uint8Array[] = [];
    const add = (bytes: Uint8Array | string) => {
      const encoder = new TextEncoder();
      chunks.push(typeof bytes === 'string' ? encoder.encode(bytes) : bytes);
    };

    add(this.RESET);
    add(this.CENTER);
    add(this.BOLD_ON);
    add(this.DOUBLE_SIZE);
    add("TEST CONNECTION\n");
    add(this.NORMAL_SIZE);
    add("PRINTER IS READY\n");
    add("--------------------------------\n");
    add(this.BOLD_OFF);
    add(this.LEFT);
    add("Interface: Bluetooth/Serial\n");
    add(`Time: ${new Date().toLocaleTimeString()}\n`);
    add("Status: Online\n");
    add("--------------------------------\n");
    add(this.CENTER);
    add("RECEIPT PRINTER TEST SUCCESS\n");
    add(this.RESET);
    add("\n\n\n\n");

    return this.combineChunks(chunks);
  }

  private static combineChunks(chunks: Uint8Array[]): Uint8Array {
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
}
