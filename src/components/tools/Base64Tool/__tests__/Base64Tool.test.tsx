import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Base64Tool from '../Base64Tool';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('Base64Tool', () => {
  it('should render initial state', () => {
    render(<Base64Tool />);
    
    expect(screen.getByText('Base64 Encoder/Decoder')).toBeInTheDocument();
    expect(screen.getByText('Encode text to Base64 or decode Base64 to text with support for standard and URL-safe variants')).toBeInTheDocument();
    expect(screen.getByText('Plain Text Input')).toBeInTheDocument();
    expect(screen.getByText('Base64 Output')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text to encode to Base64...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Base64 encoded result will appear here...')).toBeInTheDocument();
  });

  it('should encode text to standard Base64', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);

    const textarea = screen.getByPlaceholderText('Enter text to encode to Base64...');
    await user.type(textarea, 'Hello World!');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Base64 encoded result will appear here...');
      expect(outputTextarea).toHaveValue('SGVsbG8gV29ybGQh');
    });

    expect(screen.getByText('✅ Encoded successfully')).toBeInTheDocument();
  });

  it('should encode text to URL-safe Base64', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);

    // Switch to URL-safe variant
    const variantSelect = screen.getByDisplayValue('Standard');
    await user.selectOptions(variantSelect, 'url-safe');

    const textarea = screen.getByPlaceholderText('Enter text to encode to Base64...');
    await user.type(textarea, 'Hello>World?');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Base64 encoded result will appear here...');
      expect(outputTextarea).toHaveValue('SGVsbG8-V29ybGQ_');
    });
  });

  it('should decode standard Base64 to text', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);

    // Switch to decode mode
    const modeSelect = screen.getByDisplayValue('Encode');
    await user.selectOptions(modeSelect, 'decode');

    await waitFor(() => {
      expect(screen.getByText('Base64 Input')).toBeInTheDocument();
      expect(screen.getByText('Decoded Text Output')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('Paste Base64 encoded text to decode...');
    await user.type(textarea, 'SGVsbG8gV29ybGQh');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Decoded text will appear here...');
      expect(outputTextarea).toHaveValue('Hello World!');
    });

    expect(screen.getByText('✅ Decoded successfully')).toBeInTheDocument();
  });

  it('should decode URL-safe Base64 to text', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);

    // Switch to decode mode and URL-safe variant
    const modeSelect = screen.getByDisplayValue('Encode');
    await user.selectOptions(modeSelect, 'decode');

    const variantSelect = screen.getByDisplayValue('Standard');
    await user.selectOptions(variantSelect, 'url-safe');

    const textarea = screen.getByPlaceholderText('Paste Base64 encoded text to decode...');
    await user.type(textarea, 'SGVsbG8-V29ybGQ_');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Decoded text will appear here...');
      expect(outputTextarea).toHaveValue('Hello>World?');
    });
  });

  it('should auto-detect Base64 format', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);

    // Switch to decode mode
    const modeSelect = screen.getByDisplayValue('Encode');
    await user.selectOptions(modeSelect, 'decode');

    // Test standard Base64 detection (with padding)
    const textarea = screen.getByPlaceholderText('Paste Base64 encoded text to decode...');
    await user.type(textarea, 'dGVzdA==');

    await waitFor(() => {
      expect(screen.getByText('🔍 Detected standard Base64 format')).toBeInTheDocument();
    });

    // Clear and test URL-safe Base64 detection
    await user.clear(textarea);
    await user.type(textarea, 'SGVsbG8-V29ybGQ_');

    await waitFor(() => {
      expect(screen.getByText('🔍 Detected URL-safe Base64 format')).toBeInTheDocument();
    });
  });

  it('should show error for invalid Base64', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);

    // Switch to decode mode
    const modeSelect = screen.getByDisplayValue('Encode');
    await user.selectOptions(modeSelect, 'decode');

    const textarea = screen.getByPlaceholderText('Paste Base64 encoded text to decode...');
    await user.type(textarea, 'invalid-base64!@#');

    await waitFor(() => {
      expect(screen.getByText('⚠️ Input doesn\'t appear to be valid Base64')).toBeInTheDocument();
    });
  });

  it('should handle swap functionality', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);

    // First encode some text
    const textarea = screen.getByPlaceholderText('Enter text to encode to Base64...');
    await user.type(textarea, 'Hello World!');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Base64 encoded result will appear here...');
      expect(outputTextarea).toHaveValue('SGVsbG8gV29ybGQh');
    });

    // Click swap button
    const swapButton = screen.getByText('↔ Swap');
    await user.click(swapButton);

    await waitFor(() => {
      // Should now be in decode mode with the Base64 as input
      expect(screen.getByText('Base64 Input')).toBeInTheDocument();
      expect(screen.getByDisplayValue('SGVsbG8gV29ybGQh')).toBeInTheDocument();
    });

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Decoded text will appear here...');
      expect(outputTextarea).toHaveValue('Hello World!');
    });
  });

  it('should handle clear functionality', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);

    const textarea = screen.getByPlaceholderText('Enter text to encode to Base64...');
    await user.type(textarea, 'Hello World!');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Base64 encoded result will appear here...');
      expect(outputTextarea).toHaveValue('SGVsbG8gV29ybGQh');
    });

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(textarea).toHaveValue('');
    const outputTextarea = screen.getByPlaceholderText('Base64 encoded result will appear here...');
    expect(outputTextarea).toHaveValue('');
  });

  it('should handle copy functionality', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<Base64Tool />);

    const textarea = screen.getByPlaceholderText('Enter text to encode to Base64...');
    await user.type(textarea, 'Hello World!');

    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    const copyButton = screen.getByText('Copy');
    await user.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('SGVsbG8gV29ybGQh');
  });

  it('should handle Unicode text properly', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);

    const textarea = screen.getByPlaceholderText('Enter text to encode to Base64...');
    await user.type(textarea, '🌟 Hello 世界! 🚀');

    let encodedResult = '';
    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Base64 encoded result will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBeTruthy();
      encodedResult = outputTextarea.value;
    });

    // Switch to decode mode
    const modeSelect = screen.getByDisplayValue('Encode');
    await user.selectOptions(modeSelect, 'decode');

    // Clear input and paste the encoded result
    const decodeTextarea = screen.getByPlaceholderText('Paste Base64 encoded text to decode...');
    await user.clear(decodeTextarea);
    await user.type(decodeTextarea, encodedResult);

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Decoded text will appear here...');
      expect(outputTextarea).toHaveValue('🌟 Hello 世界! 🚀');
    });
  });

  it('should disable swap button when no output', () => {
    render(<Base64Tool />);
    
    const swapButton = screen.getByText('↔ Swap');
    expect(swapButton).toBeDisabled();
  });

  it('should show appropriate labels for different modes', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);

    // Initially in encode mode
    expect(screen.getByText('Plain Text Input')).toBeInTheDocument();
    expect(screen.getByText('Base64 Output')).toBeInTheDocument();

    // Switch to decode mode
    const modeSelect = screen.getByDisplayValue('Encode');
    await user.selectOptions(modeSelect, 'decode');

    await waitFor(() => {
      expect(screen.getByText('Base64 Input')).toBeInTheDocument();
      expect(screen.getByText('Decoded Text Output')).toBeInTheDocument();
    });
  });
});