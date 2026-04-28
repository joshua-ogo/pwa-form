export const PrinterStatus = {
  Disconnected: 'Disconnected',
  WaitingForPermission: 'Waiting for Permission',
  Connecting: 'Connecting',
  Connected: 'Connected',
  Ready: 'Ready',
  Printing: 'Printing',
  Success: 'Success',
  Failed: 'Failed',
  Busy: 'Busy',
  Error: 'Error',
  Unsupported: 'Unsupported'
} as const;

export type PrinterStatus = typeof PrinterStatus[keyof typeof PrinterStatus];

export const TransportType = {
  Serial: 'Serial',
  Bluetooth: 'Bluetooth',
  Mock: 'Mock'
} as const;

export type TransportType = typeof TransportType[keyof typeof TransportType];

export interface PrinterTransport {
  type: TransportType;
  name?: string | null;
  connect(deviceId?: string): Promise<void>;
  disconnect(): Promise<void>;
  write(data: Uint8Array): Promise<void>;
}

export interface SubmissionData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  timestamp: string;
}
