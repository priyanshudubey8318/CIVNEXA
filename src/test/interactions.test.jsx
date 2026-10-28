import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import AppRoutes from '../routes/AppRoutes';
import caseService from '../services/caseService';

const renderApp = (initialRoute = '/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Core FE-1 Interactions & Component Verification', () => {
  it('toggles sidebar collapse and expansion', async () => {
    renderApp('/dashboard');
    const collapseBtn = screen.getByLabelText(/Collapse sidebar navigation/i);
    expect(collapseBtn).toBeDefined();

    fireEvent.click(collapseBtn);
    expect(screen.getByLabelText(/Expand sidebar navigation/i)).toBeDefined();

    fireEvent.click(screen.getByLabelText(/Expand sidebar navigation/i));
    expect(screen.getByLabelText(/Collapse sidebar navigation/i)).toBeDefined();
  });

  it('filters cases via search input', async () => {
    renderApp('/dashboard');
    const searchInput = await screen.findByPlaceholderText(/Search by case ref, student, department/i);
    
    // Type search query
    fireEvent.change(searchInput, { target: { value: 'Aarav' } });
    
    await waitFor(() => {
      expect(screen.getByText('Aarav Sharma')).toBeDefined();
      expect(screen.queryByText('Karan Patel')).toBeNull();
    });

    // Clear search
    const clearBtn = screen.getByLabelText(/Clear search input/i);
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.getByText('Karan Patel')).toBeDefined();
    });
  });

  it('filters cases by category', async () => {
    renderApp('/dashboard');
    const categorySelect = await screen.findByLabelText(/Filter by case category/i);

    fireEvent.change(categorySelect, { target: { value: 'EXAM_INCIDENT' } });

    await waitFor(() => {
      expect(screen.getByText(/Unauthorized electronic device detected/i)).toBeDefined();
      expect(screen.queryByText(/Hostel curfew violation/i)).toBeNull();
    });

    // Reset button appears
    const resetBtn = screen.getByTitle(/Reset active filters/i);
    expect(resetBtn).toBeDefined();
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.getByText(/Hostel curfew violation/i)).toBeDefined();
    });
  });

  it('opens and closes case inspection modal', async () => {
    renderApp('/dashboard');
    const inspectButtons = await screen.findAllByTitle(/Inspect Case/i);
    expect(inspectButtons.length).toBeGreaterThan(0);

    // Open inspection modal
    fireEvent.click(inspectButtons[0]);
    expect(await screen.findByText(/Close File/i)).toBeDefined();

    // Close modal
    fireEvent.click(screen.getByText(/Close File/i));
    await waitFor(() => {
      expect(screen.queryByText(/Close File/i)).toBeNull();
    });
  });

  it('executes case workflow transition and reflects in state', async () => {
    renderApp('/dashboard');
    const inspectButtons = await screen.findAllByTitle(/Inspect Case/i);
    fireEvent.click(inspectButtons[0]);

    // Click "Mark as Resolved" in modal
    const markResolvedBtn = await screen.findByText(/Mark as Resolved/i);
    fireEvent.click(markResolvedBtn);

    // Confirm dialog should appear
    expect(await screen.findByText(/Confirm Case Workflow Transition/i)).toBeDefined();
    const confirmBtn = screen.getByText(/Confirm Transition/i);
    fireEvent.click(confirmBtn);

    // Should display resolved status
    await waitFor(() => {
      expect(screen.getAllByText(/Resolved/i).length).toBeGreaterThan(0);
    });

    // Reset mock store
    caseService.resetMockData();
  });

  it('opens QR verification modal demo', async () => {
    renderApp('/dashboard');
    const qrBtn = await screen.findByTitle(/QR student verification/i);
    fireEvent.click(qrBtn);

    expect(await screen.findByText(/Campus QR Identification & Verification/i)).toBeDefined();
    expect(screen.getByText(/Identity Verified Against Registry/i)).toBeDefined();

    // Close
    fireEvent.click(screen.getByText('Done'));
    await waitFor(() => {
      expect(screen.queryByText(/Identity Verified Against Registry/i)).toBeNull();
    });
  });

  it('switches role persona via topbar dropdown', async () => {
    renderApp('/dashboard');
    const roleButton = await screen.findByTitle(/Role Switcher/i);
    fireEvent.click(roleButton);

    expect(await screen.findByText(/ROLE WORKSPACE SWITCHER/i)).toBeDefined();

    // Select Head of Department
    const hodOption = screen.getByText(/Head of Department \(HOD\)/i);
    fireEvent.click(hodOption);

    await waitFor(() => {
      expect(screen.getAllByText(/Head of Department/i).length).toBeGreaterThan(0);
    });
  });

  it('opens and manages notifications panel', async () => {
    renderApp('/dashboard');
    const bellBtn = await screen.findByLabelText(/View notifications/i);
    fireEvent.click(bellBtn);

    expect(await screen.findByText('Notifications')).toBeDefined();
    expect(screen.getByText(/Urgent Hearing Scheduled/i)).toBeDefined();

    // Click "Mark all read"
    const markAllBtn = screen.getByText(/Mark all read/i);
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Mark all read/i)).toBeNull();
      expect(screen.getByText('Unread (0)')).toBeDefined();
    });
  });

  it('validates file upload format and allows file removal', async () => {
    renderApp('/dashboard');
    // Switch to Uploader tab
    const uploaderTab = await screen.findByText(/Evidence Uploader/i);
    fireEvent.click(uploaderTab);

    expect(await screen.findByText(/Click to upload or drag files here/i)).toBeDefined();

    // Simulate selecting a file
    const file = new File(['mock content data'], 'incident_report.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]');
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('incident_report.pdf')).toBeDefined();
    });

    // Remove file
    const removeBtn = screen.getByLabelText(/Remove file incident_report.pdf/i);
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText('incident_report.pdf')).toBeNull();
    });
  });
});
