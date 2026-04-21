import React, { useState, useEffect } from 'react';
import { NetworkStatus } from './components/NetworkStatus';
import { IntakeForm } from './components/IntakeForm';
import { SubmissionDisplay } from './components/SubmissionDisplay';

interface Submission {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  timestamp: string;
}

const App: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Load submissions from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('midnight_submissions');
    if (savedData) {
      try {
        setSubmissions(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to parse submissions', e);
      }
    }
  }, []);

  const handleFormSubmit = (data: Omit<Submission, 'timestamp'>) => {
    const newSubmission: Submission = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    const updatedSubmissions = [...submissions, newSubmission];
    setSubmissions(updatedSubmissions);
    localStorage.setItem('midnight_submissions', JSON.stringify(updatedSubmissions));
  };

  return (
    <div className="container">
      <NetworkStatus />
      
      <IntakeForm onSubmit={handleFormSubmit} />
      
      <SubmissionDisplay submissions={submissions} />
      
      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <p>© 2026 Midnight Intake PWA • Works Offline</p>
      </footer>
    </div>
  );
};

export default App;
