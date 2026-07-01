import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DeploymentStatusTag, EnvironmentTag, ServiceStatusTag } from './StatusTag';

afterEach(cleanup);

describe('StatusTag', () => {
  it('renders the deployment status label as a badge', () => {
    render(<DeploymentStatusTag status="FAILED" />);
    const badge = screen.getByText('FAILED');
    expect(badge.className).toContain('rt-badge');
    expect(badge.className).toContain('rt-badge-danger');
  });

  it('maps RUNNING to the info variant', () => {
    render(<DeploymentStatusTag status="RUNNING" />);
    expect(screen.getByText('RUNNING').className).toContain('rt-badge-info');
  });

  it('maps ROLLED_BACK to the warning variant', () => {
    render(<DeploymentStatusTag status="ROLLED_BACK" />);
    expect(screen.getByText('ROLLED_BACK').className).toContain('rt-badge-warning');
  });

  it('maps QUEUED to the muted variant', () => {
    render(<DeploymentStatusTag status="QUEUED" />);
    expect(screen.getByText('QUEUED').className).toContain('rt-badge-muted');
  });

  it('maps service status to the success variant for ACTIVE', () => {
    render(<ServiceStatusTag status="ACTIVE" />);
    expect(screen.getByText('ACTIVE').className).toContain('rt-badge-success');
  });

  it('marks the PRODUCTION environment with the production variant', () => {
    render(<EnvironmentTag environment="PRODUCTION" />);
    expect(screen.getByText('PRODUCTION').className).toContain('rt-badge-production');
  });

  it('maps MAINTENANCE service status to the maintenance variant', () => {
    render(<ServiceStatusTag status="MAINTENANCE" />);
    expect(screen.getByText('MAINTENANCE').className).toContain('rt-badge-maintenance');
  });

  it('renders ARCHIVED with the English label and inactive variant', () => {
    render(<ServiceStatusTag status="ARCHIVED" />);
    const badge = screen.getByText('ARCHIVED');
    expect(badge.className).toContain('rt-badge-inactive');
  });
});
