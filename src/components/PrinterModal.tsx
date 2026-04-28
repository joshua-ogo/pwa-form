import React, { useState, useEffect, useCallback } from 'react';
import { X, Cpu, CheckCircle2, AlertCircle, Loader2, History, PlusCircle, PowerOff, Bluetooth } from 'lucide-react';
import { PrinterManager } from '../services/printer/printerManager';
import { PrinterStatus, TransportType } from '../types/printer';

interface PrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterModal: React.FC<PrinterModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<PrinterStatus>(PrinterManager.getInstance().getStatus());
  const [error, setError] = useState<string | null>(null);
  const [knownDevices, setKnownDevices] = useState<{ id: string; name: string }[]>([]);
  
  const manager = PrinterManager.getInstance();

  const fetchDevices = useCallback(async () => {
    try {
      const devices = await manager.getKnownDevices();
      setKnownDevices(devices);
    } catch (e) {
      console.error('Failed to fetch known devices', e);
    }
  }, [manager]);

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen, fetchDevices]);

  useEffect(() => {
    return manager.subscribe((newStatus) => {
      setStatus(newStatus);
    });
  }, [manager]);

  const handleConnect = async (type: TransportType, deviceId?: string) => {
    setError(null);
    try {
      await manager.connect(type, deviceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const handleTestPrint = async () => {
    try {
      await manager.testConnection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test print failed');
    }
  };

  if (!isOpen) return null;

  const isConnecting = status === PrinterStatus.Connecting || status === PrinterStatus.WaitingForPermission;
  const isReady = status === PrinterStatus.Ready || status === PrinterStatus.Connected || status === PrinterStatus.Success;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-brand">
            <Bluetooth size={20} className="text-primary" />
            <div>
              <h2 style={{ margin: 0 }}>Bluetooth Printer</h2>
              <span className="subtitle" style={{ fontSize: '0.75rem', marginBottom: 0 }}>Connect your receipt printer</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-banner animate-in">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Current Status Section */}
          <section className="modal-section">
            <label className="section-label">Current Status</label>
            <div className={`status-display ${status.toLowerCase()}`}>
              <div className="status-indicator">
                {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <div className="dot" />}
                <span>{status}</span>
              </div>
              {isReady && (
                <span className="device-name">{manager.getActiveDeviceName()}</span>
              )}
            </div>
          </section>

          {/* Known Devices Section */}
          {knownDevices.length > 0 && !isReady && (
            <section className="modal-section">
              <label className="section-label">Previously Approved</label>
              <div className="device-grid">
                {knownDevices.map(device => (
                  <button 
                    key={device.id}
                    className="device-item"
                    onClick={() => handleConnect(TransportType.Bluetooth, device.id)}
                    disabled={isConnecting}
                  >
                    <History size={16} />
                    <div className="device-text">
                      <strong>{device.name}</strong>
                      <span>Quick Reconnect</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Connect New Section */}
          {!isReady && (
            <section className="modal-section">
              <label className="section-label">New Connection</label>
              <div className="connection-options">
                <button 
                  className="conn-option"
                  onClick={() => handleConnect(TransportType.Bluetooth)}
                  disabled={isConnecting}
                >
                  <PlusCircle size={24} />
                  <div className="conn-info">
                    <strong>Connect New Printer</strong>
                    <span>Opens browser chooser</span>
                  </div>
                </button>

                <button 
                  className="conn-option"
                  onClick={() => handleConnect(TransportType.Serial)}
                  disabled={isConnecting}
                >
                  <Cpu size={24} />
                  <div className="conn-info">
                    <strong>Serial / USB</strong>
                    <span>Best for Desktop</span>
                  </div>
                </button>

                <button 
                  className="conn-option debug-option"
                  onClick={() => handleConnect(TransportType.Mock)}
                  disabled={isConnecting}
                >
                  <Bluetooth size={24} className="text-muted" />
                  <div className="conn-info">
                    <strong>Virtual Debug</strong>
                    <span>Test without hardware</span>
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* Connected State Section */}
          {isReady && (
            <div className="success-state">
              <CheckCircle2 size={48} className="text-success" />
              <h3>Printer Ready!</h3>
              <p>Hardware connected and verified.</p>
              
              <div className="success-actions">
                <button onClick={handleTestPrint} className="test-btn">
                  Print Test Receipt
                </button>
                <button onClick={() => manager.disconnect()} className="disconnect-btn">
                  <PowerOff size={16} />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
