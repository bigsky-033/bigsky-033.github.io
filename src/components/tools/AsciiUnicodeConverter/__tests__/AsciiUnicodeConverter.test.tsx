import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AsciiUnicodeConverter from '../AsciiUnicodeConverter';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('AsciiUnicodeConverter', () => {
  it('should render initial state', () => {
    render(<AsciiUnicodeConverter />);
    
    expect(screen.getByText('ASCII/Unicode Converter')).toBeInTheDocument();
    expect(screen.getByText('Convert between text and various encoding formats including ASCII codes, Unicode, escape sequences, and HTML entities')).toBeInTheDocument();
    expect(screen.getByText('Text Input')).toBeInTheDocument();
    expect(screen.getByText('ASCII Codes (decimal)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text to convert to codes...')).toBeInTheDocument();
  });

  it('should convert text to ASCII decimal codes', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'Hello');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('72 101 108 108 111'); // ASCII codes for "Hello"
    });

    expect(screen.getByText('✅ Conversion successful')).toBeInTheDocument();
  });

  it('should convert text to ASCII hex codes', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to hex format
    const formatSelect = screen.getByDisplayValue('Decimal');
    await user.selectOptions(formatSelect, 'hex');

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'Hi');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('48 69'); // Hex codes for "Hi"
    });
  });

  it('should convert text to Unicode code points', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to Unicode output
    const outputSelect = screen.getByDisplayValue('ASCII (decimal)');
    await user.selectOptions(outputSelect, 'Unicode');

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'A🌟');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toContain('U+0041'); // Unicode for 'A'
      expect(outputTextarea.value).toContain('U+1F31F'); // Unicode for star emoji
    });
  });

  it('should convert text to escape sequences', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to escape sequences
    const outputSelect = screen.getByDisplayValue('ASCII (decimal)');
    await user.selectOptions(outputSelect, 'Escape Seq');

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'Hello\nWorld\t!');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('Hello\\nWorld\\t!');
    });
  });

  it('should convert text to HTML entities', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to HTML entities
    const outputSelect = screen.getByDisplayValue('ASCII (decimal)');
    await user.selectOptions(outputSelect, 'HTML Entity');

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, '<Hello & "World">');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('&lt;Hello &amp; &quot;World&quot;&gt;');
    });
  });

  it('should show character frequency analysis', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to frequency analysis
    const outputSelect = screen.getByDisplayValue('ASCII (decimal)');
    await user.selectOptions(outputSelect, 'Frequency');

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'Hello World');

    await waitFor(() => {
      expect(screen.getByText('Top 10 Most Frequent Characters')).toBeInTheDocument();
    });

    // Check for frequency data in output
    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toContain('l": 3 ('); // 'l' appears 3 times
      expect(outputTextarea.value).toContain('o": 2 ('); // 'o' appears 2 times
    });
  });

  it('should show character information', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to character info
    const outputSelect = screen.getByDisplayValue('ASCII (decimal)');
    await user.selectOptions(outputSelect, 'Char Info');

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'A!');

    await waitFor(() => {
      expect(screen.getByText('Character Information')).toBeInTheDocument();
    });

    // Check for character info in output
    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toContain('Character 65'); // Info for 'A'
      expect(outputTextarea.value).toContain('Exclamation Mark'); // Info for '!'
    });
  });

  it('should detect text encoding', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'Hello 世界! 🌟');

    await waitFor(() => {
      expect(screen.getByText(/📊 Detected encoding:/)).toBeInTheDocument();
      expect(screen.getByText(/UTF-8\/UTF-16/)).toBeInTheDocument();
    });
  });

  it('should convert codes to text in decode mode', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to codes-to-text mode
    const modeSelect = screen.getByDisplayValue('Text → Codes');
    await user.selectOptions(modeSelect, 'Codes → Text');

    await waitFor(() => {
      expect(screen.getByText('Code Input')).toBeInTheDocument();
      expect(screen.getByText('Converted Text')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('Enter codes to convert to text...');
    await user.type(textarea, '72 101 108 108 111'); // ASCII codes for "Hello"

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('Hello');
    });
  });

  it('should convert hex codes to text', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to codes-to-text mode
    const modeSelect = screen.getByDisplayValue('Text → Codes');
    await user.selectOptions(modeSelect, 'Codes → Text');

    // Switch to hex format
    const formatSelect = screen.getByDisplayValue('Decimal');
    await user.selectOptions(formatSelect, 'Hexadecimal');

    const textarea = screen.getByPlaceholderText('Enter codes to convert to text...');
    await user.type(textarea, '48 69'); // Hex codes for "Hi"

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('Hi');
    });
  });

  it('should convert Unicode codes to text', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to codes-to-text mode
    const modeSelect = screen.getByDisplayValue('Text → Codes');
    await user.selectOptions(modeSelect, 'Codes → Text');

    // Switch to Unicode format
    const formatSelect = screen.getByDisplayValue('Decimal');
    await user.selectOptions(formatSelect, 'Unicode');

    const textarea = screen.getByPlaceholderText('Enter codes to convert to text...');
    await user.type(textarea, 'U+0041 U+1F31F'); // Unicode for 'A' and star emoji

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('A🌟');
    });
  });

  it('should convert escape sequences to text', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to codes-to-text mode
    const modeSelect = screen.getByDisplayValue('Text → Codes');
    await user.selectOptions(modeSelect, 'Codes → Text');

    // Switch to escape sequences format
    const formatSelect = screen.getByDisplayValue('Decimal');
    await user.selectOptions(formatSelect, 'Escape Seq');

    const textarea = screen.getByPlaceholderText('Enter codes to convert to text...');
    await user.type(textarea, 'Hello\\nWorld\\t!');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('Hello\nWorld\t!');
    });
  });

  it('should convert HTML entities to text', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to codes-to-text mode
    const modeSelect = screen.getByDisplayValue('Text → Codes');
    await user.selectOptions(modeSelect, 'Codes → Text');

    // Switch to HTML entity format
    const formatSelect = screen.getByDisplayValue('Decimal');
    await user.selectOptions(formatSelect, 'HTML Entity');

    const textarea = screen.getByPlaceholderText('Enter codes to convert to text...');
    await user.type(textarea, '&lt;Hello &amp; &quot;World&quot;&gt;');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('<Hello & "World">');
    });
  });

  it('should handle binary codes', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch format to binary
    const formatSelect = screen.getByDisplayValue('Decimal');
    await user.selectOptions(formatSelect, 'Binary');

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'A');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('1000001'); // Binary for 'A' (65)
    });
  });

  it('should handle octal codes', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch format to octal
    const formatSelect = screen.getByDisplayValue('Decimal');
    await user.selectOptions(formatSelect, 'Octal');

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'A');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBe('101'); // Octal for 'A' (65)
    });
  });

  it('should handle clear functionality', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'Hello World');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toBeTruthy();
    });

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(textarea).toHaveValue('');
    const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
    expect(outputTextarea).toHaveValue('');
  });

  it('should handle copy functionality', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<AsciiUnicodeConverter />);

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'Hello');

    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    const copyButton = screen.getByText('Copy');
    await user.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('72 101 108 108 111');
  });

  it('should show appropriate labels for different modes', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Initially in text-to-codes mode
    expect(screen.getByText('Text Input')).toBeInTheDocument();
    expect(screen.getByText('ASCII Codes (decimal)')).toBeInTheDocument();

    // Switch to codes-to-text mode
    const modeSelect = screen.getByDisplayValue('Text → Codes');
    await user.selectOptions(modeSelect, 'Codes → Text');

    await waitFor(() => {
      expect(screen.getByText('Code Input')).toBeInTheDocument();
      expect(screen.getByText('Converted Text')).toBeInTheDocument();
    });
  });

  it('should handle empty input gracefully', () => {
    render(<AsciiUnicodeConverter />);
    
    const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
    expect(outputTextarea.value).toBe('');
    expect(screen.queryByText('✅ Conversion successful')).not.toBeInTheDocument();
  });

  it('should handle special characters in frequency analysis', async () => {
    const user = userEvent.setup();
    render(<AsciiUnicodeConverter />);

    // Switch to frequency analysis
    const outputSelect = screen.getByDisplayValue('ASCII (decimal)');
    await user.selectOptions(outputSelect, 'Frequency');

    const textarea = screen.getByPlaceholderText('Enter text to convert to codes...');
    await user.type(textarea, 'Hello\n\tWorld ');

    await waitFor(() => {
      const outputTextarea = screen.getByPlaceholderText('Converted output will appear here...') as HTMLTextAreaElement;
      expect(outputTextarea.value).toContain('SPACE');
      expect(outputTextarea.value).toContain('NEWLINE');
      expect(outputTextarea.value).toContain('TAB');
    });
  });
});