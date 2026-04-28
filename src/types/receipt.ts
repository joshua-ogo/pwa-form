/**
 * Raw data captured from the intake form.
 */
export interface ReceiptData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  timestamp: string;
  referenceId?: string;
}

/**
 * Structured model for the receipt formatting and encoding layers.
 */
export interface ReceiptModel {
  title: string;
  subtitle: string;
  referenceId: string;
  date: string;
  time: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  notes: string;
  footer: string;
}
