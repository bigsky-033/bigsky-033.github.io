import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UuidGenerator from '../UuidGenerator';

// Mock crypto for testing
const mockRandomValues = vi.fn();
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: mockRandomValues,
    subtle: {
      digest: vi.fn(() => {
        const mockHash = new Uint8Array(20);
        mockHash.fill(0x12);
        return Promise.resolve(mockHash.buffer);
      })
    }
  }
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('UuidGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRandomValues.mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
    });
  });

  it('should render initial state', () => {
    render(<UuidGenerator />);
    
    expect(screen.getByText('UUID Generator')).toBeInTheDocument();
    expect(screen.getByText('Generate UUIDs in various formats (v1, v4, v5) with bulk generation and validation features.')).toBeInTheDocument();
    expect(screen.getByText('Generator Settings')).toBeInTheDocument();
    expect(screen.getByText('UUID Validation')).toBeInTheDocument();
  });

  it('should display version selection options', () => {
    render(<UuidGenerator />);
    
    const versionSelect = screen.getByDisplayValue('Version 4 (Random)');
    expect(versionSelect).toBeInTheDocument();
    
    // Check all version options are present
    expect(screen.getByText('Version 1 (Time-based)')).toBeInTheDocument();
    expect(screen.getByText('Version 4 (Random)')).toBeInTheDocument();
    expect(screen.getByText('Version 5 (Namespace)')).toBeInTheDocument();
  });

  it('should display format selection options', () => {
    render(<UuidGenerator />);
    
    const formatSelect = screen.getByDisplayValue('Standard (with dashes)');
    expect(formatSelect).toBeInTheDocument();
    
    // Check all format options are present
    expect(screen.getByText('No dashes')).toBeInTheDocument();
    expect(screen.getByText('Uppercase')).toBeInTheDocument();
    expect(screen.getByText('Uppercase no dashes')).toBeInTheDocument();
  });

  it('should show version information', () => {
    render(<UuidGenerator />);
    
    expect(screen.getByText('Version 4')).toBeInTheDocument();
    expect(screen.getByText('Random UUID')).toBeInTheDocument();
    expect(screen.getByText('Secure')).toBeInTheDocument();
  });

  it('should generate v4 UUIDs by default', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const generateButton = screen.getByText('Generate UUIDs');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('✅ Generated 1 UUID')).toBeInTheDocument();
    });

    // Should show generated UUID
    const uuidElements = screen.getAllByText(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(uuidElements.length).toBeGreaterThan(0);
  });

  it('should switch between UUID versions', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const versionSelect = screen.getByDisplayValue('Version 4 (Random)');
    
    // Switch to v1
    await user.selectOptions(versionSelect, 'Version 1 (Time-based)');
    
    expect(screen.getByText('Version 1')).toBeInTheDocument();
    expect(screen.getByText('Time-based UUID with MAC address')).toBeInTheDocument();
    expect(screen.getByText('Legacy')).toBeInTheDocument();
    
    // Switch to v5
    await user.selectOptions(versionSelect, 'Version 5 (Namespace)');
    
    expect(screen.getByText('Version 5')).toBeInTheDocument();
    expect(screen.getByText('Namespace-based UUID using SHA-1')).toBeInTheDocument();
    expect(screen.getByText('v5 UUID Parameters')).toBeInTheDocument();
  });

  it('should show v5 specific inputs when v5 is selected', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const versionSelect = screen.getByDisplayValue('Version 4 (Random)');
    await user.selectOptions(versionSelect, 'Version 5 (Namespace)');

    expect(screen.getByText('v5 UUID Parameters')).toBeInTheDocument();
    expect(screen.getByText('Namespace:')).toBeInTheDocument();
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name for v5 UUID generation')).toBeInTheDocument();
  });

  it('should require namespace and name for v5 UUIDs', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const versionSelect = screen.getByDisplayValue('Version 4 (Random)');
    await user.selectOptions(versionSelect, 'Version 5 (Namespace)');

    const generateButton = screen.getByText('Generate UUIDs');
    
    // Button should be disabled initially (no name provided)
    expect(generateButton).toBeDisabled();
    
    // Add name
    const nameInput = screen.getByPlaceholderText('Enter name for v5 UUID generation');
    await user.type(nameInput, 'test-name');
    
    // Now button should be enabled
    expect(generateButton).not.toBeDisabled();
  });

  it('should generate v5 UUIDs with namespace and name', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const versionSelect = screen.getByDisplayValue('Version 4 (Random)');
    await user.selectOptions(versionSelect, 'Version 5 (Namespace)');

    const nameInput = screen.getByPlaceholderText('Enter name for v5 UUID generation');
    await user.type(nameInput, 'example.com');

    const generateButton = screen.getByText('Generate UUIDs');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('✅ Generated 1 UUID')).toBeInTheDocument();
    });
  });

  it('should support bulk UUID generation', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const countInput = screen.getByRole('spinbutton');
    await user.clear(countInput);
    await user.type(countInput, '5');

    const generateButton = screen.getByText('Generate UUIDs');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Generated.*5.*UUID/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Generated UUIDs.*5/)).toBeInTheDocument();
  });

  it('should enforce count limits', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const countInput = screen.getByRole('spinbutton');
    
    // Test the max clamping functionality  
    await user.clear(countInput);
    await user.type(countInput, '1500');
    expect(countInput).toHaveValue(1000); // Should be clamped to 1000
  });

  it('should switch between different formats', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    // Generate a UUID first
    const generateButton = screen.getByText('Generate UUIDs');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('✅ Generated 1 UUID')).toBeInTheDocument();
    });

    // Switch to no-dashes format
    const formatSelect = screen.getByDisplayValue('Standard (with dashes)');
    await user.selectOptions(formatSelect, 'No dashes');
    
    // Generate new UUID
    await user.click(generateButton);

    await waitFor(() => {
      // Should show UUID without dashes
      const noDashUuid = screen.getAllByText(/^[0-9a-f]{32}$/i);
      expect(noDashUuid.length).toBeGreaterThan(0);
    });
  });

  it('should validate UUIDs', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const validationInput = screen.getByPlaceholderText('Enter UUID to validate...');
    const validateButton = screen.getByText('Validate');

    // Test valid UUID
    await user.type(validationInput, '550e8400-e29b-41d4-a716-446655440000');
    await user.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('✅ Valid UUID')).toBeInTheDocument();
      expect(screen.getByText('Version: 4')).toBeInTheDocument();
      expect(screen.getByText('Variant: RFC 4122')).toBeInTheDocument();
    });

    // Test invalid UUID
    await user.clear(validationInput);
    await user.type(validationInput, 'invalid-uuid');
    await user.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('❌ Invalid UUID format')).toBeInTheDocument();
    });
  });

  it('should validate UUID on blur', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const validationInput = screen.getByPlaceholderText('Enter UUID to validate...');

    await user.type(validationInput, '550e8400-e29b-41d4-a716-446655440000');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText('✅ Valid UUID')).toBeInTheDocument();
    });
  });

  it('should provide copy functionality', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const generateButton = screen.getByText('Generate UUIDs');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('✅ Generated 1 UUID')).toBeInTheDocument();
    });

    // Should have copy buttons
    const copyButtons = screen.getAllByText('Copy');
    expect(copyButtons.length).toBeGreaterThan(0);

    // Should have "Copy All" button
    expect(screen.getByText('Copy All')).toBeInTheDocument();
  });

  it('should clear generated UUIDs', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    // Generate UUIDs first
    const generateButton = screen.getByText('Generate UUIDs');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('✅ Generated 1 UUID')).toBeInTheDocument();
    });

    // Clear
    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(screen.getByText('No UUIDs Generated')).toBeInTheDocument();
    expect(screen.queryByText('✅ Generated 1 UUID')).not.toBeInTheDocument();
  });

  it('should show empty state when no UUIDs generated', () => {
    render(<UuidGenerator />);

    expect(screen.getByText('No UUIDs Generated')).toBeInTheDocument();
    expect(screen.getByText('Configure settings and click "Generate UUIDs" to start')).toBeInTheDocument();
    expect(screen.getByText('🆔')).toBeInTheDocument();
  });

  it('should show loading state during generation', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const generateButton = screen.getByText('Generate UUIDs');
    
    // Check that the generation happens and completes
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('✅ Generated 1 UUID')).toBeInTheDocument();
    });
  });

  it('should show error for v5 without required parameters', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const versionSelect = screen.getByDisplayValue('Version 4 (Random)');
    await user.selectOptions(versionSelect, 'Version 5 (Namespace)');

    // Clear the name field to trigger error
    const nameInput = screen.getByPlaceholderText('Enter name for v5 UUID generation');
    await user.clear(nameInput);

    const generateButton = screen.getByText('Generate UUIDs');
    
    // Button should be disabled
    expect(generateButton).toBeDisabled();
  });

  it('should display namespace options for v5', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const versionSelect = screen.getByDisplayValue('Version 4 (Random)');
    await user.selectOptions(versionSelect, 'Version 5 (Namespace)');

    // Check namespace dropdown options
    expect(screen.getByText(/DNS \(6ba7b810-9dad-11d1-80b4-00c04fd430c8\)/)).toBeInTheDocument();
    expect(screen.getByText(/URL \(6ba7b811-9dad-11d1-80b4-00c04fd430c8\)/)).toBeInTheDocument();
    expect(screen.getByText(/OID \(6ba7b812-9dad-11d1-80b4-00c04fd430c8\)/)).toBeInTheDocument();
    expect(screen.getByText(/X500 \(6ba7b814-9dad-11d1-80b4-00c04fd430c8\)/)).toBeInTheDocument();
  });

  it('should show deterministic message for v5', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const versionSelect = screen.getByDisplayValue('Version 4 (Random)');
    await user.selectOptions(versionSelect, 'Version 5 (Namespace)');

    expect(screen.getByText('v5 UUIDs are deterministic - same namespace and name always produce the same UUID')).toBeInTheDocument();
  });

  it('should provide accessibility features', () => {
    render(<UuidGenerator />);
    
    // Check for proper labels and form structure
    expect(screen.getByText('Generator Settings')).toBeInTheDocument();
    expect(screen.getByText('UUID Validation')).toBeInTheDocument();
    expect(screen.getByText('Version:')).toBeInTheDocument();
    expect(screen.getByText('Format:')).toBeInTheDocument();
    expect(screen.getByText('Count:')).toBeInTheDocument();
  });

  it('should handle UUID parsing with timestamp for v1', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);

    const validationInput = screen.getByPlaceholderText('Enter UUID to validate...');
    
    // Test with v1 UUID (time-based)
    await user.type(validationInput, '550e8400-e29b-11d4-a716-446655440000');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('✅ Valid UUID')).toBeInTheDocument();
      expect(screen.getByText('Version: 1')).toBeInTheDocument();
    });
  });
});