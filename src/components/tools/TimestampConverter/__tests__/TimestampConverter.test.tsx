import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimestampConverter from '../TimestampConverter';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('TimestampConverter', () => {
  const mockNow = new Date('2024-01-01T12:00:00.000Z').getTime();
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render initial state', () => {
    render(<TimestampConverter />);
    
    expect(screen.getByText('Unix Timestamp Converter')).toBeInTheDocument();
    expect(screen.getByText('Convert between Unix timestamps and human-readable dates with timezone and relative time support.')).toBeInTheDocument();
    expect(screen.getByText('Conversion Settings')).toBeInTheDocument();
    expect(screen.getByText('Current Timestamp')).toBeInTheDocument();
  });

  it('should display current timestamp', () => {
    render(<TimestampConverter />);
    
    const currentTimestamp = Math.floor(mockNow / 1000);
    expect(screen.getByText(currentTimestamp.toString())).toBeInTheDocument();
  });

  it('should display timezone information', () => {
    render(<TimestampConverter />);

    expect(screen.getAllByText(/Timezone:/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Offset:/)).toBeInTheDocument();
  });

  it('should display information panel', () => {
    render(<TimestampConverter />);

    expect(screen.getByText('Information & Examples')).toBeInTheDocument();
    expect(screen.getByText('What is Unix Timestamp?')).toBeInTheDocument();
    expect(screen.getByText('Examples')).toBeInTheDocument();
    expect(screen.getByText('Supported Date Formats')).toBeInTheDocument();
    expect(screen.getByText('Tips')).toBeInTheDocument();
    expect(screen.getByText('Common Timestamps')).toBeInTheDocument();
  });

  it('should show examples in information panel', () => {
    render(<TimestampConverter />);

    expect(screen.getByText('1640995200')).toBeInTheDocument();
    expect(screen.getByText('1640995200000')).toBeInTheDocument();
    expect(screen.getAllByText(/Jan 1, 2022/).length).toBeGreaterThan(0);
  });

  it('should display common timestamps', () => {
    render(<TimestampConverter />);

    expect(screen.getByText('Unix Epoch')).toBeInTheDocument();
    expect(screen.getByText('Y2K')).toBeInTheDocument();
    expect(screen.getByText('Year 2038 Problem')).toBeInTheDocument();
    expect(screen.getByText('946684800')).toBeInTheDocument(); // Y2K timestamp
    expect(screen.getByText('2147483647')).toBeInTheDocument(); // Y2038 timestamp
  });

  it('should show supported date formats', () => {
    render(<TimestampConverter />);

    expect(screen.getByText(/ISO 8601:/)).toBeInTheDocument();
    expect(screen.getByText(/RFC 2822:/)).toBeInTheDocument();
    expect(screen.getByText(/Simple:/)).toBeInTheDocument();
    expect(screen.getByText(/Natural:/)).toBeInTheDocument();
  });

  it('should display tips', () => {
    render(<TimestampConverter />);

    expect(screen.getByText(/Use "Auto-detect"/)).toBeInTheDocument();
    expect(screen.getByText(/current timestamp updates/)).toBeInTheDocument();
    expect(screen.getByText(/Relative time shows/)).toBeInTheDocument();
    expect(screen.getByText(/All conversions respect/)).toBeInTheDocument();
  });

  it('should have proper form structure', () => {
    render(<TimestampConverter />);
    
    // Check for proper labels and form structure
    expect(screen.getByText('Conversion Settings')).toBeInTheDocument();
    expect(screen.getByText('Unit:')).toBeInTheDocument();
    expect(screen.getAllByText('Timezone:').length).toBeGreaterThan(0);
    expect(screen.getByText('Timestamp to Date')).toBeInTheDocument();
    expect(screen.getByText('Date to Timestamp')).toBeInTheDocument();
    
    // Check for input labels
    expect(screen.getByText('Unix Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Human-readable Date')).toBeInTheDocument();
  });

  it('should have input fields', () => {
    render(<TimestampConverter />);

    expect(screen.getByPlaceholderText(/Enter Unix timestamp/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter date/)).toBeInTheDocument();
  });

  it('should have control buttons', () => {
    render(<TimestampConverter />);

    expect(screen.getByText('Use Current Time')).toBeInTheDocument();
    expect(screen.getByText('Convert Units')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('should disable unit selection when auto-detect is enabled', () => {
    render(<TimestampConverter />);

    const unitSelect = screen.getByDisplayValue('Seconds');
    const autoDetectCheckbox = screen.getByRole('checkbox', { name: /Auto-detect/ });

    expect(autoDetectCheckbox).toBeChecked();
    expect(unitSelect).toBeDisabled();
  });

  it('should disable convert units button when no valid timestamp', () => {
    render(<TimestampConverter />);

    const convertButton = screen.getByText('Convert Units');
    expect(convertButton).toBeDisabled();
  });

  it('should have timezone select with options', () => {
    render(<TimestampConverter />);

    const timezoneSelect = screen.getByDisplayValue('Local Time');
    expect(timezoneSelect).toBeInTheDocument();
    
    // Check some timezone options exist
    expect(screen.getByText('UTC')).toBeInTheDocument();
    expect(screen.getByText('Eastern Time (ET)')).toBeInTheDocument();
  });
});