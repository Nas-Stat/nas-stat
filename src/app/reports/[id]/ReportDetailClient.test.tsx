import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportDetailClient, { type ReportDetail } from './ReportDetailClient';
import { expect, test, vi, describe, beforeEach } from 'vitest';

// Mock Map component
vi.mock('@/components/Map', () => ({
  default: () => <div data-testid="mocked-map">Mocked Map</div>,
}));

// Mock server actions
const mockClaimReport = vi.fn().mockResolvedValue({ success: true });
const mockEscalateReport = vi.fn().mockResolvedValue({ success: true });
const mockResolveReport = vi.fn().mockResolvedValue({ success: true });
const mockRejectReport = vi.fn().mockResolvedValue({ success: true });

vi.mock('../actions', () => ({
  claimReport: (...args: unknown[]) => mockClaimReport(...args),
  escalateReport: (...args: unknown[]) => mockEscalateReport(...args),
  resolveReport: (...args: unknown[]) => mockResolveReport(...args),
  rejectReport: (...args: unknown[]) => mockRejectReport(...args),
}));

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const BASE_REPORT: ReportDetail = {
  id: 'report-1',
  title: 'Rozbité chodníky',
  description: 'Popis problému',
  location: { lng: 14.4378, lat: 50.0755 },
  rating: 3,
  category: 'Infrastruktura',
  status: 'pending',
  createdAt: '2026-01-15T10:00:00Z',
  assignedTo: null,
  escalatedToRole: null,
};

describe('ReportDetailClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders title, status badge, category, rating and date', () => {
    render(
      <ReportDetailClient
        report={BASE_REPORT}
        assignedProfile={null}
        currentProfile={null}
        currentUserId={null}
      />
    );

    expect(screen.getByTestId('report-title')).toHaveTextContent('Rozbité chodníky');
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Čeká');
    expect(screen.getByTestId('report-category')).toHaveTextContent('Infrastruktura');
    expect(screen.getByTestId('report-rating')).toHaveTextContent('★★★☆☆');
    expect(screen.getByTestId('report-date')).toBeInTheDocument();
  });

  test('renders map preview when location is present', () => {
    render(
      <ReportDetailClient
        report={BASE_REPORT}
        assignedProfile={null}
        currentProfile={null}
        currentUserId={null}
      />
    );

    expect(screen.getByTestId('map-preview')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-map')).toBeInTheDocument();
  });

  test('does not render map preview when location is null', () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, location: null }}
        assignedProfile={null}
        currentProfile={null}
        currentUserId={null}
      />
    );

    expect(screen.queryByTestId('map-preview')).not.toBeInTheDocument();
  });

  test('renders description when present', () => {
    render(
      <ReportDetailClient
        report={BASE_REPORT}
        assignedProfile={null}
        currentProfile={null}
        currentUserId={null}
      />
    );

    expect(screen.getByTestId('report-description')).toHaveTextContent('Popis problému');
  });

  test('renders assigned official info with role badge', () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, assignedTo: 'user-1', status: 'in_review' }}
        assignedProfile={{ username: 'jan.novak', role: 'obec' }}
        currentProfile={null}
        currentUserId={null}
      />
    );

    const assigned = screen.getByTestId('assigned-official');
    expect(assigned).toHaveTextContent('jan.novak');
    expect(screen.getByTestId('assigned-role-badge')).toHaveTextContent('Obec');
  });

  test('renders escalation info when status is escalated', () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'escalated', escalatedToRole: 'kraj' }}
        assignedProfile={null}
        currentProfile={null}
        currentUserId={null}
      />
    );

    expect(screen.getByTestId('escalation-info')).toHaveTextContent('Eskalováno na: Kraj');
  });

  test('does not render action buttons for citizen user', () => {
    render(
      <ReportDetailClient
        report={BASE_REPORT}
        assignedProfile={null}
        currentProfile={{ role: 'citizen', role_verified: true }}
        currentUserId="user-1"
      />
    );

    expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument();
  });

  test('does not render action buttons for unverified official', () => {
    render(
      <ReportDetailClient
        report={BASE_REPORT}
        assignedProfile={null}
        currentProfile={{ role: 'obec', role_verified: false }}
        currentUserId="user-1"
      />
    );

    expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument();
  });

  test('renders Převzít button for verified official on pending report', () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'pending' }}
        assignedProfile={null}
        currentProfile={{ role: 'obec', role_verified: true }}
        currentUserId="user-1"
      />
    );

    expect(screen.getByTestId('btn-claim')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-resolve')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-reject')).not.toBeInTheDocument();
  });

  test('renders Převzít button for verified official on escalated report matching role', () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'escalated', escalatedToRole: 'obec' }}
        assignedProfile={null}
        currentProfile={{ role: 'obec', role_verified: true }}
        currentUserId="user-1"
      />
    );

    expect(screen.getByTestId('btn-claim')).toBeInTheDocument();
  });

  test('does not show Převzít for verified official when escalated to different role', () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'escalated', escalatedToRole: 'kraj' }}
        assignedProfile={null}
        currentProfile={{ role: 'obec', role_verified: true }}
        currentUserId="user-1"
      />
    );

    expect(screen.queryByTestId('btn-claim')).not.toBeInTheDocument();
  });

  test('renders Vyřešit, Zamítnout, Eskalovat for assignee in in_review status', () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'in_review', assignedTo: 'user-1' }}
        assignedProfile={{ username: 'jan', role: 'obec' }}
        currentProfile={{ role: 'obec', role_verified: true }}
        currentUserId="user-1"
      />
    );

    expect(screen.getByTestId('btn-resolve')).toBeInTheDocument();
    expect(screen.getByTestId('btn-reject')).toBeInTheDocument();
    expect(screen.getByTestId('btn-escalate')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-claim')).not.toBeInTheDocument();
  });

  test('does not show Eskalovat when role is at top of hierarchy', () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'in_review', assignedTo: 'user-1' }}
        assignedProfile={{ username: 'min', role: 'ministerstvo' }}
        currentProfile={{ role: 'ministerstvo', role_verified: true }}
        currentUserId="user-1"
      />
    );

    expect(screen.getByTestId('btn-resolve')).toBeInTheDocument();
    expect(screen.getByTestId('btn-reject')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-escalate')).not.toBeInTheDocument();
  });

  test('does not show assignee actions for non-assignee official', () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'in_review', assignedTo: 'other-user' }}
        assignedProfile={{ username: 'jan', role: 'obec' }}
        currentProfile={{ role: 'obec', role_verified: true }}
        currentUserId="user-1"
      />
    );

    expect(screen.queryByTestId('btn-resolve')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-reject')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-escalate')).not.toBeInTheDocument();
  });

  test('claimReport is called when Převzít is clicked', async () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'pending' }}
        assignedProfile={null}
        currentProfile={{ role: 'obec', role_verified: true }}
        currentUserId="user-1"
      />
    );

    fireEvent.click(screen.getByTestId('btn-claim'));

    await waitFor(() => {
      expect(mockClaimReport).toHaveBeenCalledWith('report-1');
    });
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test('resolveReport is called when Vyřešit is clicked', async () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'in_review', assignedTo: 'user-1' }}
        assignedProfile={{ username: 'jan', role: 'obec' }}
        currentProfile={{ role: 'obec', role_verified: true }}
        currentUserId="user-1"
      />
    );

    fireEvent.click(screen.getByTestId('btn-resolve'));

    await waitFor(() => {
      expect(mockResolveReport).toHaveBeenCalledWith('report-1');
    });
  });

  test('rejectReport is called when Zamítnout is clicked', async () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'in_review', assignedTo: 'user-1' }}
        assignedProfile={{ username: 'jan', role: 'obec' }}
        currentProfile={{ role: 'obec', role_verified: true }}
        currentUserId="user-1"
      />
    );

    fireEvent.click(screen.getByTestId('btn-reject'));

    await waitFor(() => {
      expect(mockRejectReport).toHaveBeenCalledWith('report-1');
    });
  });

  test('escalateReport is called when Eskalovat is clicked', async () => {
    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'in_review', assignedTo: 'user-1' }}
        assignedProfile={{ username: 'jan', role: 'obec' }}
        currentProfile={{ role: 'obec', role_verified: true }}
        currentUserId="user-1"
      />
    );

    fireEvent.click(screen.getByTestId('btn-escalate'));

    await waitFor(() => {
      expect(mockEscalateReport).toHaveBeenCalledWith('report-1');
    });
  });

  test('displays error message when action fails', async () => {
    mockClaimReport.mockRejectedValueOnce(new Error('Hlášení nelze převzít.'));

    render(
      <ReportDetailClient
        report={{ ...BASE_REPORT, status: 'pending' }}
        assignedProfile={null}
        currentProfile={{ role: 'obec', role_verified: true }}
        currentUserId="user-1"
      />
    );

    fireEvent.click(screen.getByTestId('btn-claim'));

    await waitFor(() => {
      expect(screen.getByTestId('action-error')).toHaveTextContent('Hlášení nelze převzít.');
    });
  });

  test('renders back link to /reports', () => {
    render(
      <ReportDetailClient
        report={BASE_REPORT}
        assignedProfile={null}
        currentProfile={null}
        currentUserId={null}
      />
    );

    const backLink = screen.getByTestId('back-link');
    expect(backLink).toHaveAttribute('href', '/reports');
  });
});
