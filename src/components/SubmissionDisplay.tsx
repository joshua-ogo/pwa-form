import { User, Mail, Phone, MapPin, FileText, Database, Printer } from 'lucide-react';
import { PrinterService } from '../utils/printer';

interface Submission {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  timestamp: string;
}

interface SubmissionDisplayProps {
  submissions: Submission[];
}

export const SubmissionDisplay: React.FC<SubmissionDisplayProps> = ({ submissions }) => {
  if (submissions.length === 0) return null;

  return (
    <div className="submission-list">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Database size={20} className="text-muted database-icon" />
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Local Submissions</h2>
        </div>
        <button 
          onClick={() => PrinterService.standardPrint()}
          className="print-btn"
          style={{ width: 'auto', marginTop: 0, padding: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          <Printer size={16} />
          Print Records
        </button>
      </div>
      
      {submissions.map((sub, index) => (
        <div key={index} className="submission-card">
          <div className="submission-grid">
            <div className="submission-item">
              <span className="item-label"><User size={12} style={{marginRight: '4px'}} /> Name</span>
              <span className="item-value">{sub.fullName}</span>
            </div>
            <div className="submission-item">
              <span className="item-label"><Mail size={12} style={{marginRight: '4px'}} /> Email</span>
              <span className="item-value">{sub.email}</span>
            </div>
            <div className="submission-item">
              <span className="item-label"><Phone size={12} style={{marginRight: '4px'}} /> Phone</span>
              <span className="item-value">{sub.phone || 'N/A'}</span>
            </div>
            <div className="submission-item">
              <span className="item-label"><MapPin size={12} style={{marginRight: '4px'}} /> Address</span>
              <span className="item-value">{sub.address || 'N/A'}</span>
            </div>
          </div>
          <div className="submission-item" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
            <span className="item-label"><FileText size={12} style={{marginRight: '4px'}} /> Notes</span>
            <span className="item-value">{sub.notes || 'No notes provided.'}</span>
          </div>
        </div>
      )).reverse()}
    </div>
  );
};
