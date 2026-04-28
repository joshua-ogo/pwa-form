import { Database, Printer, Receipt, Loader2 } from 'lucide-react';
import { PrinterService } from '../utils/printer';
import { PrinterManager } from '../services/printer/printerManager';
import { PrinterStatus } from '../types/printer';
import type { SubmissionData } from '../types/printer';
import React, { useState, useEffect } from 'react';

interface SubmissionDisplayProps {
  submissions: SubmissionData[];
}

export const SubmissionDisplay: React.FC<SubmissionDisplayProps> = ({ submissions }) => {
  const [status, setStatus] = useState<PrinterStatus>(PrinterManager.getInstance().getStatus());
  const manager = PrinterManager.getInstance();

  useEffect(() => {
    return manager.subscribe((newStatus) => setStatus(newStatus));
  }, [manager]);

  const handleThermalPrint = async (data: SubmissionData) => {
    try {
      await manager.print(data);
    } catch (err) {
      // Error handled by status display in PrinterControls, but alert for immediate feedback
      console.error('Print error:', err);
    }
  };

  if (submissions.length === 0) return null;

  const isPrinting = status === PrinterStatus.Printing;

  return (
    <div className="submission-list">
      <div className="list-header">
        <div className="header-title">
          <Database size={18} className="text-muted" />
          <h2>Local History</h2>
        </div>
        <button 
          onClick={() => PrinterService.standardPrint()}
          className="browser-print-btn"
        >
          <Printer size={14} />
          Standard PDF
        </button>
      </div>
      
      {submissions.map((sub, index) => {
        const ref = new Date(sub.timestamp).getTime().toString().slice(-6);
        return (
          <div key={index} className="pos-card">
            <div className="card-top">
              <div className="card-meta">
                <span className="ref-badge">#{ref}</span>
                <span className="time-stamp">{new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <button 
                onClick={() => handleThermalPrint(sub)}
                disabled={status !== PrinterStatus.Ready && status !== PrinterStatus.Success}
                className={`pos-print-btn ${isPrinting ? 'loading' : ''}`}
              >
                {isPrinting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Receipt size={16} />
                )}
                Print Receipt
              </button>
            </div>

            <div className="pos-content">
              <div className="info-row">
                <div className="info-cell">
                  <label>Customer</label>
                  <strong>{sub.fullName}</strong>
                </div>
                <div className="info-cell">
                  <label>Contact</label>
                  <span>{sub.email}</span>
                </div>
              </div>
              
              <div className="info-row secondary">
                <div className="info-cell">
                  <label>Phone</label>
                  <span>{sub.phone || '---'}</span>
                </div>
                <div className="info-cell">
                  <label>Address</label>
                  <span>{sub.address || 'No address provided'}</span>
                </div>
              </div>

              {sub.notes && (
                <div className="info-notes">
                  <label>Remarks</label>
                  <p>{sub.notes}</p>
                </div>
              )}
            </div>
          </div>
        );
      }).reverse()}
    </div>
  );
};
