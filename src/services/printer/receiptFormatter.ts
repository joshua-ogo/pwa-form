import type { ReceiptData, ReceiptModel } from '../../types/receipt';

/**
 * receiptFormatter
 * Maps raw app data into a structured receipt model and provides a text-based preview.
 */
export const receiptFormatter = {
  /**
   * Converts raw form data into a structured ReceiptModel.
   */
  format(data: ReceiptData): ReceiptModel {
    const now = data.timestamp ? new Date(data.timestamp) : new Date();
    
    return {
      title: "PWA INTAKE",
      subtitle: "INTAKE SYSTEM",
      referenceId: data.referenceId || now.getTime().toString().slice(-6),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customer: {
        name: data.fullName,
        email: data.email,
        phone: data.phone || 'N/A',
        address: data.address || 'N/A',
      },
      notes: data.notes || '',
      footer: "THANK YOU FOR YOUR VISIT"
    };
  },

  /**
   * Generates a plain-text thermal-style preview string.
   */
  generatePreview(model: ReceiptModel): string {
    const hr = "--------------------------------";
    
    let text = `${model.title}\n`;
    text += `${model.subtitle}\n`;
    text += `${hr}\n`;
    text += `DATE: ${model.date}\n`;
    text += `TIME: ${model.time}\n`;
    text += `REF: #${model.referenceId}\n`;
    text += `${hr}\n\n`;
    
    text += `CUSTOMER: ${model.customer.name}\n`;
    text += `EMAIL: ${model.customer.email}\n`;
    text += `PHONE: ${model.customer.phone}\n`;
    text += `ADDRESS: ${model.customer.address}\n\n`;
    
    if (model.notes) {
      text += `NOTES:\n${model.notes}\n\n`;
    }
    
    text += `${hr}\n`;
    text += `${model.footer}\n`;
    text += `WWW.MANLAGO.COM\n`;
    
    return text;
  }
};
