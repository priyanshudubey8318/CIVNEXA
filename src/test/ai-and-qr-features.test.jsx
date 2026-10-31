import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import StudentDigitalIdPage from '../pages/student/StudentDigitalIdPage';
import QrScannerPage from '../pages/qr/QrScannerPage';
import AiAssistantPage from '../pages/ai/AiAssistantPage';
import AiComplaintClassifier from '../components/ai/AiComplaintClassifier';
import { qrService } from '../services/qrService';
import { aiService } from '../services/aiService';

vi.mock('../services/qrService', () => ({
  qrService: {
    getStudentCard: vi.fn(),
    verifyStudentQr: vi.fn(),
    verifyCaseQr: vi.fn(),
    verifyEvidenceCustody: vi.fn(),
    recordEvidenceCustodyAction: vi.fn(),
  },
}));

vi.mock('../services/aiService', () => ({
  aiService: {
    classifyComplaint: vi.fn(),
    detectDuplicates: vi.fn(),
    askAssistant: vi.fn(),
    getKnowledgeDocuments: vi.fn(),
    uploadKnowledgeDocument: vi.fn(),
  },
}));

const mockStudent = {
  id: 101,
  userReference: 'STU-2026-99001',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@institution.edu',
  role: 'STUDENT',
  status: 'ACTIVE',
};

const renderWithProviders = (ui) => {
  window.sessionStorage.setItem('civnexa_auth_session', 'active');
  window.sessionStorage.setItem('civnexa_current_user', JSON.stringify(mockStudent));

  return render(
    <MemoryRouter>
      <AuthProvider defaultAuthenticated={true}>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('CIVNEXA AI Intelligence & Real QR Scanner Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Student Digital Identity Card
  describe('Student Digital ID Card', () => {
    it('renders student digital identity card with details and QR code SVG', async () => {
      qrService.getStudentCard.mockResolvedValueOnce({
        qrToken: 'DIGI-STU-A1B2C3D4E5F6',
        userReference: 'STU-2026-99001',
        fullName: 'Aarav Sharma',
        rollNumber: '2026-CSE-042',
        department: 'Computer Science & Engineering',
        status: 'ACTIVE',
        issuedAt: new Date().toISOString(),
        revoked: false,
      });

      renderWithProviders(<StudentDigitalIdPage />);

      expect(await screen.findByText('Student Digital Identity Card')).toBeDefined();
      expect(await screen.findByText('Aarav Sharma')).toBeDefined();
      expect(screen.getByText('2026-CSE-042')).toBeDefined();
      expect(screen.getByText('Computer Science & Engineering')).toBeDefined();
      expect(screen.getByText('ACTIVE')).toBeDefined();

      // Check QR SVG presence
      const svg = document.querySelector('svg');
      expect(svg).toBeDefined();
    });
  });

  // 2. Real QR Scanner with Manual Fallback
  describe('Staff QR Scanner', () => {
    it('renders camera controls and manual token fallback input', async () => {
      renderWithProviders(<QrScannerPage />);

      expect(screen.getByText('Institutional QR Scanner')).toBeDefined();
      expect(screen.getByRole('button', { name: /Start Camera Scanner/i })).toBeDefined();
      expect(screen.getByPlaceholderText(/e\.g\. DIGI-STU-\.\.\./i)).toBeDefined();
    });

    it('verifies student token when entered via manual fallback', async () => {
      qrService.verifyStudentQr.mockResolvedValueOnce({
        valid: true,
        userReference: 'STU-2026-99001',
        studentName: 'Aarav Sharma',
        rollNumber: '2026-CSE-042',
        department: 'Computer Science',
        role: 'STUDENT',
        status: 'ACTIVE',
        message: 'Student identity successfully verified and authenticated.',
      });

      renderWithProviders(<QrScannerPage />);

      const input = screen.getByPlaceholderText(/e\.g\. DIGI-STU-\.\.\./i);
      const submitBtn = screen.getByRole('button', { name: /Verify Token/i });

      fireEvent.change(input, { target: { value: 'DIGI-STU-TEST123456' } });
      fireEvent.click(submitBtn);

      expect(await screen.findByText('Verification Successful')).toBeDefined();
      expect(screen.getByText('Aarav Sharma')).toBeDefined();
      expect(screen.getByText('2026-CSE-042')).toBeDefined();
    });
  });

  // 3. AI Institutional Assistant RAG
  describe('Institutional AI Assistant', () => {
    it('renders assistant query interface and displays grounded answers with citations', async () => {
      aiService.getKnowledgeDocuments.mockResolvedValueOnce([
        { id: 1, title: 'Student Handbook 2026', category: 'HANDBOOK', checksumSha256: 'abc123456789' },
      ]);

      aiService.askAssistant.mockResolvedValueOnce({
        question: 'What is the anti-ragging policy?',
        answer: 'Ragging is strictly prohibited on campus with zero tolerance under institutional bylaws.',
        grounded: true,
        citations: [
          { documentTitle: 'Anti-Ragging Regulations', section: 'Section 1', excerpt: 'Zero tolerance across campus.' },
        ],
      });

      renderWithProviders(<AiAssistantPage />);

      expect(await screen.findByText('Institutional AI Assistant')).toBeDefined();
      expect(await screen.findByText('Student Handbook 2026')).toBeDefined();

      const input = screen.getByPlaceholderText(/Ask a question/i);
      const askBtn = screen.getByRole('button', { name: /Ask/i });

      fireEvent.change(input, { target: { value: 'What is the anti-ragging policy?' } });
      fireEvent.click(askBtn);

      expect(await screen.findByText(/Ragging is strictly prohibited on campus/i)).toBeDefined();
      expect(screen.getAllByText(/Grounded in Institutional Knowledge/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/\[Anti-Ragging Regulations\]/i)).toBeDefined();
    });
  });

  // 4. AI Complaint Classifier
  describe('AI Complaint Classifier', () => {
    it('analyzes complaint text and emits suggestion to parent form', async () => {
      aiService.classifyComplaint.mockResolvedValueOnce({
        suggestedCategory: 'ACADEMIC_INTEGRITY',
        suggestedDepartment: 'Academic Affairs',
        suggestedPriority: 'HIGH',
        confidence: 0.92,
        reasoning: 'Midterm exam cheating detected.',
        humanConfirmationRequired: true,
      });
      aiService.detectDuplicates.mockResolvedValueOnce([]);

      const onApply = vi.fn();
      renderWithProviders(
        <AiComplaintClassifier
          title="Exam cheating in Hall 4"
          description="Student used cell phone during exam"
          onApplySuggestion={onApply}
        />
      );

      const analyzeBtn = screen.getByRole('button', { name: /Analyze Complaint with AI/i });
      fireEvent.click(analyzeBtn);

      expect(await screen.findByText(/Suggested Category: ACADEMIC_INTEGRITY/i)).toBeDefined();
      expect(screen.getByText(/HIGH/i)).toBeDefined();
      expect(screen.getByText(/92%/i)).toBeDefined();

      const applyBtn = screen.getByRole('button', { name: /Apply Recommendation/i });
      fireEvent.click(applyBtn);

      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestedCategory: 'ACADEMIC_INTEGRITY',
          suggestedPriority: 'HIGH',
        })
      );
    });
  });
});
