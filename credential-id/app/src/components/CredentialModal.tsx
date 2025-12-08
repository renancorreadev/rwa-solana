import React, { useState } from 'react';
import { useCredential } from '../context/CredentialContext';
import { CredentialType } from '../types/credential';
import './CredentialModal.css';

interface KycStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed';
}

const initialSteps: KycStep[] = [
  { id: 'connect', title: 'Connect Wallet', description: 'Connect your Solana wallet', status: 'current' },
  { id: 'verify', title: 'Identity Verification', description: 'Verify your identity', status: 'pending' },
  { id: 'credential', title: 'Get Credential', description: 'Receive your on-chain credential', status: 'pending' },
];

export function CredentialModal() {
  const { state, config, closeModal, isModalOpen, fetchCredential } = useCredential();
  const [steps, setSteps] = useState<KycStep[]>(initialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isModalOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate KYC API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i === 0 ? 'completed' : i === 1 ? 'current' : 'pending'
    })));
    setCurrentStep(1);
    setIsSubmitting(false);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i < 2 ? 'completed' : 'current'
    })));
    setCurrentStep(2);
    setIsSubmitting(false);

    // In production, this would be triggered by the backend after issuing credential
    await fetchCredential();
  };

  const getCredentialTypeLabel = (type?: CredentialType) => {
    switch (type) {
      case CredentialType.KycBasic: return 'Basic KYC';
      case CredentialType.KycFull: return 'Full KYC';
      case CredentialType.AccreditedInvestor: return 'Accredited Investor';
      case CredentialType.QualifiedPurchaser: return 'Qualified Purchaser';
      case CredentialType.BrazilianCpf: return 'CPF (Brazil)';
      case CredentialType.BrazilianCnpj: return 'CNPJ (Brazil)';
      default: return 'KYC Verification';
    }
  };

  return (
    <div className={`hcp-modal-backdrop ${config?.theme || 'light'}`} onClick={handleBackdropClick}>
      <div className="hcp-modal">
        <button className="hcp-modal-close" onClick={closeModal}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="hcp-modal-header">
          <div className="hcp-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
              <path d="M10 16l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2>Hub Credential</h2>
          <p>{getCredentialTypeLabel(config?.requiredCredentialType)}</p>
        </div>

        <div className="hcp-steps">
          {steps.map((step, index) => (
            <div key={step.id} className={`hcp-step ${step.status}`}>
              <div className="hcp-step-indicator">
                {step.status === 'completed' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="hcp-step-content">
                <span className="hcp-step-title">{step.title}</span>
                <span className="hcp-step-desc">{step.description}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hcp-modal-body">
          {state.loading ? (
            <div className="hcp-loading">
              <div className="hcp-spinner" />
              <p>Checking your credential status...</p>
            </div>
          ) : state.isVerified && state.credential ? (
            <div className="hcp-success">
              <div className="hcp-success-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="#10B981" fillOpacity="0.1" />
                  <path d="M14 24l8 8 12-12" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Credential Verified!</h3>
              <p>Your {getCredentialTypeLabel(state.credential.credentialType as CredentialType)} credential is active.</p>
              <div className="hcp-credential-info">
                <div className="hcp-info-row">
                  <span>Status</span>
                  <span className="hcp-status active">Active</span>
                </div>
                <div className="hcp-info-row">
                  <span>Expires</span>
                  <span>{new Date(state.credential.expiresAt.toNumber() * 1000).toLocaleDateString()}</span>
                </div>
              </div>
              <button className="hcp-btn hcp-btn-primary" onClick={closeModal}>
                Continue
              </button>
            </div>
          ) : currentStep === 0 ? (
            <form onSubmit={handleEmailSubmit} className="hcp-form">
              <p className="hcp-form-desc">
                To access this marketplace, you need to verify your identity. Enter your email to start the KYC process.
              </p>
              <div className="hcp-input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <button type="submit" className="hcp-btn hcp-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="hcp-btn-spinner" />
                    Processing...
                  </>
                ) : (
                  'Start Verification'
                )}
              </button>
            </form>
          ) : currentStep === 1 ? (
            <form onSubmit={handleVerificationSubmit} className="hcp-form">
              <p className="hcp-form-desc">
                We sent a verification code to {email}. Enter the code below to continue.
              </p>
              <div className="hcp-input-group">
                <label htmlFor="code">Verification Code</label>
                <input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" className="hcp-btn hcp-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="hcp-btn-spinner" />
                    Verifying...
                  </>
                ) : (
                  'Verify Identity'
                )}
              </button>
              <button type="button" className="hcp-btn hcp-btn-secondary">
                Resend Code
              </button>
            </form>
          ) : (
            <div className="hcp-issuing">
              <div className="hcp-spinner" />
              <h3>Issuing Your Credential</h3>
              <p>Please wait while we create your on-chain credential...</p>
            </div>
          )}

          {state.error && (
            <div className="hcp-error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M10 6v4M10 13v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{state.error}</span>
            </div>
          )}
        </div>

        <div className="hcp-modal-footer">
          <p>
            Powered by <strong>Hub Credential Protocol</strong>
          </p>
          <p className="hcp-privacy">
            Your data is encrypted and stored securely.
            <a href="#" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
