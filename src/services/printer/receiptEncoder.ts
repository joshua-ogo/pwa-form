import type { ReceiptModel } from '../../types/receipt';

/**
 * receiptEncoder
 * Turns a structured ReceiptModel into a Uint8Array of printer-ready bytes (ESC/POS).
 */
export const receiptEncoder = {
  // ESC/POS Commands
  CMD: {
    INIT: [0x1B, 0x40],
    ALIGN_LEFT: [0x1B, 0x61, 0x00],
    ALIGN_CENTER: [0x1B, 0x61, 0x01],
    ALIGN_RIGHT: [0x1B, 0x61, 0x02],
    BOLD_ON: [0x1B, 0x45, 0x01],
    BOLD_OFF: [0x1B, 0x45, 0x00],
    SIZE_LARGE: [0x1D, 0x21, 0x11], // 2x Width, 2x Height
    SIZE_NORMAL: [0x1D, 0x21, 0x00],
    FEED_CUT: [0x1D, 0x56, 0x41, 0x10], // Feed 16 lines and cut
    FEED_LINE: [0x0A],
  },

  /**
   * Encodes a ReceiptModel into ESC/POS bytes.
   */
  encode(model: ReceiptModel): Uint8Array {
    const encoder = new TextEncoder();
    const buffer: number[] = [];

    const add = (bytes: number[]) => buffer.push(...bytes);
    const addText = (text: string) => buffer.push(...Array.from(encoder.encode(text)));

    // 1. Initialize
    add(this.CMD.INIT);

    // 2. Header
    add(this.CMD.ALIGN_CENTER);
    add(this.CMD.SIZE_LARGE);
    add(this.CMD.BOLD_ON);
    addText(`${model.title}\n`);
    add(this.CMD.SIZE_NORMAL);
    addText(`${model.subtitle}\n`);
    add(this.CMD.BOLD_OFF);
    add(this.CMD.FEED_LINE);

    // 3. Metadata
    add(this.CMD.ALIGN_LEFT);
    addText(`DATE: ${model.date}\n`);
    addText(`TIME: ${model.time}\n`);
    addText(`REF:  #${model.referenceId}\n`);
    addText("--------------------------------\n");
    add(this.CMD.FEED_LINE);

    // 4. Customer Info
    add(this.CMD.BOLD_ON);
    addText("CUSTOMER INFORMATION\n");
    add(this.CMD.BOLD_OFF);
    addText(`NAME:    ${model.customer.name}\n`);
    addText(`EMAIL:   ${model.customer.email}\n`);
    addText(`PHONE:   ${model.customer.phone}\n`);
    addText(`ADDRESS: ${model.customer.address}\n`);
    add(this.CMD.FEED_LINE);

    // 5. Notes
    if (model.notes) {
      add(this.CMD.BOLD_ON);
      addText("REMARKS:\n");
      add(this.CMD.BOLD_OFF);
      addText(`${model.notes}\n`);
      add(this.CMD.FEED_LINE);
    }

    // 6. Footer
    add(this.CMD.ALIGN_CENTER);
    addText("--------------------------------\n");
    add(this.CMD.BOLD_ON);
    addText(`${model.footer}\n`);
    add(this.CMD.BOLD_OFF);
    addText("WWW.MANLAGO.COM\n");

    // 7. Finish
    add(this.CMD.FEED_LINE);
    add(this.CMD.FEED_LINE);
    add(this.CMD.FEED_LINE);
    add(this.CMD.FEED_CUT);

    return new Uint8Array(buffer);
  }
};
