import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

interface IntakeFormProps {
  onSubmit: (data: FormData) => void;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      alert('Full Name and Email are required.');
      return;
    }
    onSubmit(formData);
    setSubmitted(true);
    setFormData({ fullName: '', email: '', phone: '', address: '', notes: '' });
    
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <form className="glass-card" onSubmit={handleSubmit}>
      <h1>Intake Form</h1>
      <p className="subtitle">Please provide your details below.</p>

      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="John Doe"
          required
        />
      </div>

      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            required
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 234 567 890"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Midnight St, Night City"
        />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional information..."
        />
      </div>

      <button type="submit" disabled={submitted}>
        {submitted ? (
          <>
            <CheckCircle size={20} />
            Submitted Successfully
          </>
        ) : (
          <>
            <Send size={20} />
            Submit Information
          </>
        )}
      </button>
    </form>
  );
};
