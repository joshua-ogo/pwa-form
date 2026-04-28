import React, { useState, useEffect } from 'react';
import { Printer, Bluetooth, Cpu, RefreshCw, Zap, Check, Settings2, Trash2 } from 'lucide-react';
import { PrinterManager } from '../services/printer/printerManager';
import { PrinterStatus, TransportType } from '../types/printer';
import { PrinterModal } from './PrinterModal';

export const PrinterControls: React.FC = () => {
  const [status, setStatus] = useState<PrinterStatus>(PrinterManager.getInstance().getStatus());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const manager = PrinterManager.getInstance();

  useEffect(() => {
    return manager.subscribe((newStatus) => setStatus(newStatus));
  }, []);

  const handleReconnect = async () => {
    const lastType = localStorage.getItem('last_printer_type') as TransportType;
    if (lastType) {
      try {
        await manager.connect(lastType);
      } catch (err) {
        setIsModalOpen(true); // Fallback to modal if quick reconnect fails
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const statusMap = {
    [PrinterStatus.Disconnected]: { label: 'Offline', color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.1)' },
    [PrinterStatus.WaitingForPermission]: { label: 'Authorize', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    [PrinterStatus.Connecting]: { label: 'Connecting', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    [PrinterStatus.Connected]: { label: 'Ready', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' },
    [PrinterStatus.Ready]: { label: 'Ready', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' },
    [PrinterStatus.Printing]: { label: 'Printing', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
    [PrinterStatus.Success]: { label: 'Success', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' },
    [PrinterStatus.Failed]: { label: 'Failed', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' },
    [PrinterStatus.Busy]: { label: 'Busy', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
    [PrinterStatus.Error]: { label: 'Error', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' },
    [PrinterStatus.Unsupported]: { label: 'Unsupported', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' },
  };

  const currentStatus = statusMap[status] || statusMap[PrinterStatus.Disconnected];

  return (
    <div className="printer-dashboard glass-card">
      <div className="dashboard-header">
        <div className="brand">
          <div className="icon-wrapper">
            <Printer size={18} />
          </div>
          <div className="brand-text">
            <h3>Hardware Hub</h3>
            <span className="subtitle">Thermal Printer Management</span>
          </div>
        </div>
        
        <div className="status-badge" style={{ color: currentStatus.color, backgroundColor: currentStatus.bg }}>
          {status === PrinterStatus.Ready || status === PrinterStatus.Success ? (
            <Check size={12} strokeWidth={3} />
          ) : (
            <div className={`status-dot ${status === PrinterStatus.Printing ? 'pulse' : ''}`} style={{ backgroundColor: currentStatus.color }} />
          )}
          {currentStatus.label}
        </div>
      </div>

      <div className="dashboard-content">
        {(status === PrinterStatus.Disconnected || status === PrinterStatus.Error || status === PrinterStatus.Unsupported) ? (
          <div className="empty-state">
            <p>
              {status === PrinterStatus.Error 
                ? 'Connection failed. Please try again.' 
                : 'No printer active. Connect to start printing receipts.'}
            </p>
            <button onClick={handleReconnect} className="connect-main-btn">
              <Zap size={16} />
              {localStorage.getItem('last_printer_type') ? 'Quick Reconnect' : 'Setup Hardware'}
            </button>
          </div>
        ) : (
          <div className="active-state">
            <div className="device-info">
              <div className="device-icon">
                {localStorage.getItem('last_printer_type') === TransportType.Bluetooth ? <Bluetooth size={24} /> : <Cpu size={24} />}
              </div>
              <div className="device-details">
                <strong>{localStorage.getItem('last_printer_type') || 'Unknown'} Printer</strong>
                <span>Active Connection</span>
              </div>
            </div>
            
            <div className="action-row">
              <button onClick={() => manager.testConnection()} disabled={status === PrinterStatus.Printing} className="action-btn">
                <RefreshCw size={14} />
                Test
              </button>
              <button onClick={() => setIsModalOpen(true)} className="action-btn">
                <Settings2 size={14} />
                Switch
              </button>
              <button onClick={() => manager.disconnect()} className="action-btn danger">
                <Trash2 size={14} />
                Stop
              </button>
            </div>
          </div>
        )}
      </div>

      <PrinterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
