import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('should update current timestamp every second', () => {
    render(<TimestampConverter />);
    
    const initialTimestamp = Math.floor(mockNow / 1000);
    expect(screen.getByText(initialTimestamp.toString())).toBeInTheDocument();
    
    // Advance time by 1 second
    vi.advanceTimersByTime(1000);
    
    const newTimestamp = Math.floor((mockNow + 1000) / 1000);
    expect(screen.getByText(newTimestamp.toString())).toBeInTheDocument();
  });

  it('should convert timestamp to date', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    await user.type(timestampInput, '1640995200');

    await waitFor(() => {
      expect(screen.getByText(/Human-readable Date/)).toBeInTheDocument();
      expect(screen.getByText(/01\/01\/2022/)).toBeInTheDocument();
    });
  });

  it('should show relative time for timestamps', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    // Use a timestamp that's 1 hour ago from mockNow
    const oneHourAgo = Math.floor(mockNow / 1000) - 3600;
    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    await user.type(timestampInput, oneHourAgo.toString());

    await waitFor(() => {
      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
    });
  });

  it('should convert date to timestamp', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const dateInput = screen.getByPlaceholderText(/Enter date/);
    await user.type(dateInput, '2022-01-01T00:00:00Z');

    await waitFor(() => {
      expect(screen.getByText(/Unix Timestamp \(seconds\)/)).toBeInTheDocument();
      expect(screen.getByText('1640995200')).toBeInTheDocument();
      expect(screen.getByText(/Unix Timestamp \(milliseconds\)/)).toBeInTheDocument();
      expect(screen.getByText('1640995200000')).toBeInTheDocument();
    });
  });

  it('should handle invalid timestamp input', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    await user.type(timestampInput, 'invalid');

    await waitFor(() => {
      expect(screen.getByText(/Invalid timestamp format/)).toBeInTheDocument();
    });
  });

  it('should handle invalid date input', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const dateInput = screen.getByPlaceholderText(/Enter date/);
    await user.type(dateInput, 'invalid date');

    await waitFor(() => {
      expect(screen.getByText(/Invalid Date Format/)).toBeInTheDocument();
    });
  });

  it('should switch between seconds and milliseconds', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    // Turn off auto-detect first
    const autoDetectCheckbox = screen.getByRole('checkbox', { name: /Auto-detect/ });
    await user.click(autoDetectCheckbox);

    const unitSelect = screen.getByDisplayValue('Seconds');
    await user.selectOptions(unitSelect, 'Milliseconds');

    expect(screen.getByDisplayValue('Milliseconds')).toBeInTheDocument();
  });

  it('should auto-detect timestamp unit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    // Enter a milliseconds timestamp
    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    await user.type(timestampInput, '1640995200000');

    await waitFor(() => {
      expect(screen.getByText('Detected unit: milliseconds')).toBeInTheDocument();
    });
  });

  it('should change timezone', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const timezoneSelect = screen.getByDisplayValue('Local Time');
    await user.selectOptions(timezoneSelect, 'UTC');

    expect(screen.getByDisplayValue('UTC')).toBeInTheDocument();
  });

  it('should display timezone information', () => {
    render(<TimestampConverter />);

    expect(screen.getByText(/Timezone:/)).toBeInTheDocument();
    expect(screen.getByText(/Offset:/)).toBeInTheDocument();
  });

  it('should use current timestamp button', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const useCurrentButton = screen.getByText('Use Current Time');
    await user.click(useCurrentButton);

    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    const currentTimestamp = Math.floor(mockNow / 1000);
    expect(timestampInput).toHaveValue(currentTimestamp.toString());
  });

  it('should convert between units', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    // First enter a timestamp
    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    await user.type(timestampInput, '1640995200');

    // Click convert units button
    const convertButton = screen.getByText('Convert Units');
    await user.click(convertButton);

    await waitFor(() => {
      expect(timestampInput).toHaveValue('1640995200000');
      expect(screen.getByDisplayValue('Milliseconds')).toBeInTheDocument();
    });
  });

  it('should clear all inputs', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    // Enter some data
    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    const dateInput = screen.getByPlaceholderText(/Enter date/);
    
    await user.type(timestampInput, '1640995200');
    await user.type(dateInput, '2022-01-01');

    // Clear
    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(timestampInput).toHaveValue('');
    expect(dateInput).toHaveValue('');
  });

  it('should show copy buttons for results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    await user.type(timestampInput, '1640995200');

    await waitFor(() => {
      const copyButtons = screen.getAllByText('Copy');
      expect(copyButtons.length).toBeGreaterThan(0);
    });
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
    expect(screen.getByText(/Jan 1, 2022 00:00:00 UTC/)).toBeInTheDocument();
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

  it('should handle timezone selection with all options', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const timezoneSelect = screen.getByDisplayValue('Local Time');
    
    // Test a few timezone options
    await user.selectOptions(timezoneSelect, 'America/New_York');
    expect(screen.getByDisplayValue('Eastern Time (ET)')).toBeInTheDocument();

    await user.selectOptions(timezoneSelect, 'Europe/London');
    expect(screen.getByDisplayValue('London (GMT)')).toBeInTheDocument();

    await user.selectOptions(timezoneSelect, 'Asia/Tokyo');
    expect(screen.getByDisplayValue('Tokyo (JST)')).toBeInTheDocument();
  });

  it('should disable unit selection when auto-detect is enabled', () => {
    render(<TimestampConverter />);

    const unitSelect = screen.getByDisplayValue('Seconds');
    const autoDetectCheckbox = screen.getByRole('checkbox', { name: /Auto-detect/ });

    expect(autoDetectCheckbox).toBeChecked();
    expect(unitSelect).toBeDisabled();
  });

  it('should enable unit selection when auto-detect is disabled', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const unitSelect = screen.getByDisplayValue('Seconds');
    const autoDetectCheckbox = screen.getByRole('checkbox', { name: /Auto-detect/ });

    await user.click(autoDetectCheckbox);

    expect(autoDetectCheckbox).not.toBeChecked();
    expect(unitSelect).not.toBeDisabled();
  });

  it('should disable convert units button when no valid timestamp', () => {
    render(<TimestampConverter />);

    const convertButton = screen.getByText('Convert Units');
    expect(convertButton).toBeDisabled();
  });

  it('should enable convert units button with valid timestamp', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    await user.type(timestampInput, '1640995200');

    await waitFor(() => {
      const convertButton = screen.getByText('Convert Units');
      expect(convertButton).not.toBeDisabled();
    });
  });

  it('should handle edge case timestamps', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    
    // Test Unix epoch (0)
    await user.clear(timestampInput);
    await user.type(timestampInput, '0');

    await waitFor(() => {
      expect(screen.getByText(/01\/01\/1970/)).toBeInTheDocument();
    });

    // Test Y2038 problem timestamp
    await user.clear(timestampInput);
    await user.type(timestampInput, '2147483647');

    await waitFor(() => {
      expect(screen.getByText(/01\/19\/2038/)).toBeInTheDocument();
    });
  });

  it('should handle very large timestamps (out of range)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    
    // Test with a very large timestamp (year 4000+)
    await user.type(timestampInput, '99999999999');

    await waitFor(() => {
      expect(screen.getByText(/Timestamp is out of valid range/)).toBeInTheDocument();
    });
  });

  it('should provide accessibility features', () => {
    render(<TimestampConverter />);
    
    // Check for proper labels and form structure
    expect(screen.getByText('Conversion Settings')).toBeInTheDocument();
    expect(screen.getByText('Unit:')).toBeInTheDocument();
    expect(screen.getByText('Timezone:')).toBeInTheDocument();
    expect(screen.getByText('Timestamp to Date')).toBeInTheDocument();
    expect(screen.getByText('Date to Timestamp')).toBeInTheDocument();
    
    // Check for input labels
    expect(screen.getByText('Unix Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Human-readable Date')).toBeInTheDocument();
  });

  it('should handle rapid input changes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    
    // Rapidly change input
    await user.type(timestampInput, '1640995200');
    await user.clear(timestampInput);
    await user.type(timestampInput, '1641081600');
    await user.clear(timestampInput);
    await user.type(timestampInput, '1641168000');

    await waitFor(() => {
      expect(screen.getByText(/01\/03\/2022/)).toBeInTheDocument();
    });
  });

  it('should maintain state when switching between inputs', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TimestampConverter />);

    const timestampInput = screen.getByPlaceholderText(/Enter Unix timestamp/);
    const dateInput = screen.getByPlaceholderText(/Enter date/);
    
    // Enter timestamp
    await user.type(timestampInput, '1640995200');
    
    // Enter date
    await user.type(dateInput, '2022-01-02');
    
    // Both should still be visible
    expect(timestampInput).toHaveValue('1640995200');
    expect(dateInput).toHaveValue('2022-01-02');
    
    await waitFor(() => {
      expect(screen.getByText(/01\/01\/2022/)).toBeInTheDocument(); // From timestamp
      expect(screen.getByText('1641081600')).toBeInTheDocument(); // From date
    });
  });
});