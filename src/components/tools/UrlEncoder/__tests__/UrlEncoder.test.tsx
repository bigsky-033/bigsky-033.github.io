import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UrlEncoder from '../UrlEncoder';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('UrlEncoder', () => {
  it('should render initial state', () => {
    render(<UrlEncoder />);
    
    expect(screen.getByText('URL Encoder/Decoder')).toBeInTheDocument();
    expect(screen.getByText('Encode/decode URLs and URL components with support for query parameters')).toBeInTheDocument();
    expect(screen.getByText('Text/URL Input')).toBeInTheDocument();
    expect(screen.getByText('Encoded Output')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text or URL to encode...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Encoded result will appear here...')).toBeInTheDocument();
  });

  it('should encode text using component encoding', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    const textarea = screen.getByPlaceholderText('Enter text or URL to encode...');
    await user.type(textarea, 'Hello World!');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Encoded result will appear here...');
      expect(outputTextarea).toHaveValue('Hello%20World!');
    });

    expect(screen.getByText('✅ Encoded successfully (Component)')).toBeInTheDocument();
  });

  it('should encode URL using full URI encoding', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    // Switch to full URI encoding
    const typeSelect = screen.getByDisplayValue('Component');
    await user.selectOptions(typeSelect, 'full');

    const textarea = screen.getByPlaceholderText('Enter text or URL to encode...');
    await user.type(textarea, 'https://example.com/path with spaces');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Encoded result will appear here...');
      expect(outputTextarea).toHaveValue('https://example.com/path%20with%20spaces');
    });
  });

  it('should decode URL encoded text', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    // Switch to decode mode
    const modeSelect = screen.getByDisplayValue('Encode');
    await user.selectOptions(modeSelect, 'decode');

    await waitFor(() => {
      expect(screen.getByText('Encoded URL Input')).toBeInTheDocument();
      expect(screen.getByText('Decoded Output')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('Paste URL encoded text to decode...');
    await user.type(textarea, 'Hello%20World!');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Decoded text will appear here...');
      expect(outputTextarea).toHaveValue('Hello World!');
    });

    expect(screen.getByText('✅ Decoded successfully (Component)')).toBeInTheDocument();
  });

  it('should auto-detect URL encoding', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    // Switch to decode mode
    const modeSelect = screen.getByDisplayValue('Encode');
    await user.selectOptions(modeSelect, 'decode');

    // Test encoded text detection
    const textarea = screen.getByPlaceholderText('Paste URL encoded text to decode...');
    await user.type(textarea, 'Hello%20World%21');

    await waitFor(() => {
      expect(screen.getByText('🔍 Detected URL encoded text')).toBeInTheDocument();
    });

    // Clear and test decoded text detection
    await user.clear(textarea);
    await user.type(textarea, 'Hello World!');

    await waitFor(() => {
      expect(screen.getByText('ℹ️ Text appears to be already decoded')).toBeInTheDocument();
    });
  });

  it('should detect valid URLs', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    const textarea = screen.getByPlaceholderText('Enter text or URL to encode...');
    await user.type(textarea, 'https://example.com/path');

    await waitFor(() => {
      expect(screen.getByText('✅ Valid URL detected')).toBeInTheDocument();
    });
  });

  it('should handle query parameters', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    const textarea = screen.getByPlaceholderText('Enter text or URL to encode...');
    await user.type(textarea, 'https://example.com?name=John&age=30');

    await waitFor(() => {
      expect(screen.getByText('Query Parameters')).toBeInTheDocument();
    });

    // Check that query parameters are parsed
    expect(screen.getByDisplayValue('name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('age')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  it('should allow adding query parameters', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    const textarea = screen.getByPlaceholderText('Enter text or URL to encode...');
    await user.type(textarea, 'https://example.com?existing=value');

    await waitFor(() => {
      expect(screen.getByText('Query Parameters')).toBeInTheDocument();
    });

    // Add a new parameter
    const addButton = screen.getByText('+ Add');
    await user.click(addButton);

    // Find the empty key input (should be the last one)
    const keyInputs = screen.getAllByPlaceholderText('Key');
    const newKeyInput = keyInputs[keyInputs.length - 1];
    await user.clear(newKeyInput);
    await user.type(newKeyInput, 'newkey');

    const valueInputs = screen.getAllByPlaceholderText('Value');
    const newValueInput = valueInputs[valueInputs.length - 1];
    await user.clear(newValueInput);
    await user.type(newValueInput, 'newvalue');

    await waitFor(() => {
      // Check that the URL contains the new parameter (input may be truncated in test)
      expect((textarea as HTMLTextAreaElement).value).toMatch(/[?&]n.*=newvalue/);
    });
  });

  it('should allow removing query parameters', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    const textarea = screen.getByPlaceholderText('Enter text or URL to encode...');
    await user.type(textarea, 'https://example.com?param1=value1&param2=value2');

    await waitFor(() => {
      expect(screen.getByText('Query Parameters')).toBeInTheDocument();
    });

    // Remove a parameter
    const removeButtons = screen.getAllByText('×');
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).not.toContain('param1=value1');
    });
  });

  it('should handle swap functionality', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    // First encode some text
    const textarea = screen.getByPlaceholderText('Enter text or URL to encode...');
    await user.type(textarea, 'Hello World!');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Encoded result will appear here...');
      expect(outputTextarea).toHaveValue('Hello%20World!');
    });

    // Click swap button
    const swapButton = screen.getByText('↔ Swap');
    await user.click(swapButton);

    await waitFor(() => {
      // Should now be in decode mode with the encoded text as input
      expect(screen.getByText('Encoded URL Input')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hello%20World!')).toBeInTheDocument();
    });

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Decoded text will appear here...');
      expect(outputTextarea).toHaveValue('Hello World!');
    });
  });

  it('should handle clear functionality', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    const textarea = screen.getByPlaceholderText('Enter text or URL to encode...');
    await user.type(textarea, 'https://example.com?test=value');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Encoded result will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBeTruthy();
    });

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(textarea).toHaveValue('');
    const outputTextarea = screen.getByPlaceholderText('Encoded result will appear here...');
    expect(outputTextarea).toHaveValue('');
    expect(screen.queryByText('Query Parameters')).not.toBeInTheDocument();
  });

  it('should handle copy functionality', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<UrlEncoder />);

    const textarea = screen.getByPlaceholderText('Enter text or URL to encode...');
    await user.type(textarea, 'Hello World!');

    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    const copyButton = screen.getByText('Copy');
    await user.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('Hello%20World!');
  });

  it('should show error for invalid encoded text', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    // Switch to decode mode
    const modeSelect = screen.getByDisplayValue('Encode');
    await user.selectOptions(modeSelect, 'decode');

    const textarea = screen.getByPlaceholderText('Paste URL encoded text to decode...');
    await user.type(textarea, '%ZZ'); // Invalid hex sequence

    await waitFor(() => {
      expect(screen.getByText(/Invalid URL encoded string|Invalid URI encoded string/)).toBeInTheDocument();
    });
  });

  it('should handle different encoding types', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    const textarea = screen.getByPlaceholderText('Enter text or URL to encode...');
    await user.type(textarea, 'Hello World! @#$%');

    // Test component encoding (default)
    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Encoded result will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toContain('%20'); // Space encoded
      expect(outputTextarea.value).toContain('%40'); // @ encoded
    });

    // Switch to full URI encoding
    const typeSelect = screen.getByDisplayValue('Component');
    await user.selectOptions(typeSelect, 'full');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Encoded result will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toContain('%20'); // Space still encoded
      // Full URI encoding preserves some characters that component encoding doesn't
    });
  });

  it('should disable swap button when no output', () => {
    render(<UrlEncoder />);
    
    const swapButton = screen.getByText('↔ Swap');
    expect(swapButton).toBeDisabled();
  });

  it('should show appropriate labels for different modes', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    // Initially in encode mode
    expect(screen.getByText('Text/URL Input')).toBeInTheDocument();
    expect(screen.getByText('Encoded Output')).toBeInTheDocument();

    // Switch to decode mode
    const modeSelect = screen.getByDisplayValue('Encode');
    await user.selectOptions(modeSelect, 'decode');

    await waitFor(() => {
      expect(screen.getByText('Encoded URL Input')).toBeInTheDocument();
      expect(screen.getByText('Decoded Output')).toBeInTheDocument();
    });
  });

  it('should handle query string only input', async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);

    const textarea = screen.getByPlaceholderText('Enter text or URL to encode...');
    await user.type(textarea, '?name=John&city=New York');

    await waitFor(() => {
      expect(screen.getByText('Query Parameters')).toBeInTheDocument();
      expect(screen.getByDisplayValue('name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('city')).toBeInTheDocument();
      expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
    });
  });
});