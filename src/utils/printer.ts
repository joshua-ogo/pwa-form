/**
 * PrinterService
 * 
 * An abstraction layer for handling printing operations.
 * Currently supports standard browser printing via window.print().
 * Designed to be extended for Direct Bluetooth/USB printing in the future.
 */
export class PrinterService {
  /**
   * standardPrint
   * Triggers the native browser print dialog.
   * 
   * NOTE: The layout is controlled via CSS @media print rules in index.css.
   */
  static standardPrint(): void {
    window.print();
  }

  /**
   * FUTURE: Bluetooth Printer Support
   * To add direct thermal printing (ESC/POS), you would implement it here.
   * Example: 
   * static async printToBluetooth(data: any) {
   *   const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['printer'] }] });
   *   // ... handle GATT connection and raw command sending
   * }
   */

  /**
   * FUTURE: WebUSB Printer Support
   * Example:
   * static async printToUSB(data: any) {
   *   const device = await navigator.usb.requestDevice({ filters: [{ vendorId: 0x... }] });
   *   // ... handle USB transfer for raw printing
   * }
   */
}
