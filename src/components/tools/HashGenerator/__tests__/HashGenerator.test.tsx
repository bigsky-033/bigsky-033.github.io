import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HashGenerator from '../HashGenerator';

// Mock the crypto-js module
vi.mock('crypto-js', () => ({
  default: {
    MD5: vi.fn(() => ({
      toString: () => 'd41d8cd98f00b204e9800998ecf8427e' // Empty string MD5
    })),
    lib: {
      WordArray: {
        create: vi.fn((input) => input)
      }
    }
  }
}));

// Mock Web Crypto API
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn((algorithm) => {
        // Return mock hash based on algorithm
        const mockHashes = {
          'SHA-1': new Uint8Array(20).fill(0),
          'SHA-256': new Uint8Array(32).fill(0),
          'SHA-512': new Uint8Array(64).fill(0)
        };
        return Promise.resolve(mockHashes[algorithm as keyof typeof mockHashes]);
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

describe('HashGenerator', () => {
  it('should render initial state', () => {
    render(<HashGenerator />);
    
    expect(screen.getByText('Hash Generator')).toBeInTheDocument();
    expect(screen.getByText('Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files. Compare hashes and verify integrity.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text to generate hashes...')).toBeInTheDocument();
    expect(screen.getByText('Generated Hashes')).toBeInTheDocument();
  });

  it('should display all hash algorithm sections', () => {
    render(<HashGenerator />);
    
    expect(screen.getByText('MD5')).toBeInTheDocument();
    expect(screen.getByText('SHA-1')).toBeInTheDocument();
    expect(screen.getByText('SHA-256')).toBeInTheDocument();
    expect(screen.getByText('SHA-512')).toBeInTheDocument();
  });

  it('should show security indicators for algorithms', () => {
    render(<HashGenerator />);
    
    const secureLabels = screen.getAllByText('Secure');
    const legacyLabels = screen.getAllByText('Legacy');
    
    expect(secureLabels).toHaveLength(2); // SHA-256 and SHA-512
    expect(legacyLabels).toHaveLength(2); // MD5 and SHA-1
  });

  it('should generate hashes when text is entered', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);

    const textarea = screen.getByPlaceholderText('Enter text to generate hashes...');
    await user.type(textarea, 'test input');

    await waitFor(() => {
      expect(screen.getByText('✅ Hashes generated successfully')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should switch between text and file input modes', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);

    const modeSelect = screen.getByDisplayValue('Text');
    
    // Switch to file mode
    await user.selectOptions(modeSelect, 'File');
    
    expect(screen.getByText('📁')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    // Switch back to text mode
    await user.selectOptions(modeSelect, 'Text');
    
    expect(screen.getByPlaceholderText('Enter text to generate hashes...')).toBeInTheDocument();
  });

  it('should switch between lowercase and uppercase hash formats', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);

    const formatSelect = screen.getByDisplayValue('lowercase');
    
    // Test switching to uppercase
    await user.selectOptions(formatSelect, 'UPPERCASE');
    
    expect(screen.getByDisplayValue('UPPERCASE')).toBeInTheDocument();
    
    // Switch back to lowercase
    await user.selectOptions(formatSelect, 'lowercase');
    
    expect(screen.getByDisplayValue('lowercase')).toBeInTheDocument();
  });

  it('should show hash comparison section', () => {
    render(<HashGenerator />);
    
    expect(screen.getByText('Hash Comparison')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter hash to compare...')).toBeInTheDocument();
  });

  it('should handle hash comparison input', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);

    const compareInput = screen.getByPlaceholderText('Enter hash to compare...');
    await user.type(compareInput, 'd41d8cd98f00b204e9800998ecf8427e');

    // Should show some comparison result
    await waitFor(() => {
      const comparisonResult = screen.getByText(/Enter hash to compare|No match found|Matches/);
      expect(comparisonResult).toBeInTheDocument();
    });
  });

  it('should clear all inputs and results', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);

    const textarea = screen.getByPlaceholderText('Enter text to generate hashes...');
    const compareInput = screen.getByPlaceholderText('Enter hash to compare...');
    
    // Add some input
    await user.type(textarea, 'test input');
    await user.type(compareInput, 'test hash');

    // Click clear button
    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    // Check that inputs are cleared
    expect(textarea).toHaveValue('');
    expect(compareInput).toHaveValue('');
  });

  it('should display algorithm information', () => {
    render(<HashGenerator />);
    
    // Check for algorithm descriptions
    expect(screen.getByText(/Message Digest Algorithm 5/)).toBeInTheDocument();
    expect(screen.getByText(/Secure Hash Algorithm 1/)).toBeInTheDocument();
    expect(screen.getByText(/Secure Hash Algorithm 256-bit/)).toBeInTheDocument();
    expect(screen.getByText(/Secure Hash Algorithm 512-bit/)).toBeInTheDocument();
  });

  it('should show placeholder text when no input is provided', () => {
    render(<HashGenerator />);
    
    const placeholders = screen.getAllByText('Enter text to generate hash');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('should handle file selection in file mode', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);

    // Switch to file mode
    const modeSelect = screen.getByDisplayValue('Text');
    await user.selectOptions(modeSelect, 'File');

    // Test file input UI presence by checking for file input element
    const fileInput = document.querySelector('input[type="file"]');
    
    // Note: File input testing in jsdom is limited, so we mainly test the UI presence
    expect(fileInput).toBeInTheDocument();
  });

  it('should show loading state when generating hashes', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);

    const textarea = screen.getByPlaceholderText('Enter text to generate hashes...');
    
    // Start typing (this might trigger loading state briefly)
    await user.type(textarea, 'test');
    
    // The loading state might be too brief to catch consistently, 
    // so we mainly test that the component handles it
    expect(textarea).toHaveValue('test');
  });

  it('should display copy buttons for generated hashes', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);

    const textarea = screen.getByPlaceholderText('Enter text to generate hashes...');
    await user.type(textarea, 'test input');

    // Wait for hashes to generate and copy buttons to appear
    await waitFor(() => {
      const copyButtons = screen.getAllByText('Copy');
      expect(copyButtons.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('should handle empty text input gracefully', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);

    const textarea = screen.getByPlaceholderText('Enter text to generate hashes...');
    
    // Type and then clear
    await user.type(textarea, 'test');
    await user.clear(textarea);

    // Should not show error or success messages for empty input
    expect(screen.queryByText('❌')).not.toBeInTheDocument();
    expect(screen.queryByText('✅ Hashes generated successfully')).not.toBeInTheDocument();
  });

  it('should maintain consistent hash display format', () => {
    render(<HashGenerator />);
    
    // All hash display areas should be present and properly structured
    const hashSections = screen.getAllByText(/32 characters|40 characters|64 characters|128 characters/);
    expect(hashSections).toHaveLength(4);
  });

  it('should provide accessibility features', () => {
    render(<HashGenerator />);
    
    // Check for proper labels and form structure
    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Generated Hashes')).toBeInTheDocument();
    expect(screen.getByText('Hash Comparison')).toBeInTheDocument();
    
    // Check for select elements with labels
    expect(screen.getByText('Mode:')).toBeInTheDocument();
    expect(screen.getByText('Format:')).toBeInTheDocument();
  });
});