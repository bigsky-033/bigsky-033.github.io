import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JwtDecoder from '../JwtDecoder';

// Helper function to create a test JWT using btoa directly
const createTestJWT = (header: object, payload: object, signature = 'test-signature') => {
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('JwtDecoder', () => {
  it('should render initial state', () => {
    render(<JwtDecoder />);
    
    expect(screen.getAllByText('JWT Token Decoder')).toHaveLength(2); // Header and empty state
    expect(screen.getByText('Decode and display JWT token header, payload, and signature with metadata')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste your JWT token here...')).toBeInTheDocument();
    expect(screen.getByText('Paste a JWT token above to decode and analyze it')).toBeInTheDocument();
  });

  it('should decode a valid JWT token', async () => {
    const user = userEvent.setup();
    render(<JwtDecoder />);

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { 
      sub: '1234567890', 
      name: 'John Doe', 
      iat: 1516239022,
      exp: Math.floor(Date.now() / 1000) + 3600 // Future timestamp
    };
    const jwt = createTestJWT(header, payload);

    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, jwt);

    await waitFor(() => {
      expect(screen.getByText('✅ Valid JWT Token')).toBeInTheDocument();
    });

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Payload')).toBeInTheDocument();
    expect(screen.getByText('Signature & Metadata')).toBeInTheDocument();
    
    // Check if decoded content is displayed
    expect(screen.getByText(/"alg": "HS256"/)).toBeInTheDocument();
    expect(screen.getByText(/"name": "John Doe"/)).toBeInTheDocument();
    expect(screen.getByText('Algorithm:')).toBeInTheDocument();
    expect(screen.getByText('HS256')).toBeInTheDocument();
  });

  it('should show error for invalid JWT format', async () => {
    const user = userEvent.setup();
    render(<JwtDecoder />);

    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.clear(textarea);
    await user.type(textarea, 'invalid.jwt');

    // Wait for the error to appear
    await waitFor(() => {
      expect(screen.getByText(/Invalid JWT format/)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Should not show the empty state when there's an error
    expect(screen.queryByText('Paste a JWT token above to decode and analyze it')).not.toBeInTheDocument();
  });

  it('should show expired token warning', async () => {
    const user = userEvent.setup();
    render(<JwtDecoder />);

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { 
      sub: '1234567890', 
      exp: Math.floor(Date.now() / 1000) - 3600 // Past timestamp (expired)
    };
    const jwt = createTestJWT(header, payload);

    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, jwt);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Token Expired')).toBeInTheDocument();
    });
  });

  it('should display JWT metadata correctly', async () => {
    const user = userEvent.setup();
    render(<JwtDecoder />);

    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = { 
      iss: 'https://example.com',
      sub: 'user123',
      aud: 'my-app',
      exp: 1700000000,
      iat: 1650000000,
      jti: 'jwt-id-123'
    };
    const jwt = createTestJWT(header, payload);

    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, jwt);

    await waitFor(() => {
      expect(screen.getByText('Token Metadata')).toBeInTheDocument();
    });

    expect(screen.getByText('Issuer (iss)')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('Subject (sub)')).toBeInTheDocument();
    expect(screen.getByText('user123')).toBeInTheDocument();
    expect(screen.getByText('JWT ID (jti)')).toBeInTheDocument();
    expect(screen.getByText('jwt-id-123')).toBeInTheDocument();
  });

  it('should clear data when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<JwtDecoder />);

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: '1234567890', name: 'John Doe' };
    const jwt = createTestJWT(header, payload);

    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, jwt);

    await waitFor(() => {
      expect(screen.getByText('✅ Valid JWT Token')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(textarea).toHaveValue('');
    expect(screen.queryByText('✅ Valid JWT Token')).not.toBeInTheDocument();
    expect(screen.getByText('Paste a JWT token above to decode and analyze it')).toBeInTheDocument();
  });

  it('should handle copy functionality', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<JwtDecoder />);

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: '1234567890', name: 'John Doe' };
    const jwt = createTestJWT(header, payload);

    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, jwt);

    await waitFor(() => {
      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    const copyButtons = screen.getAllByText('Copy');
    expect(copyButtons.length).toBeGreaterThan(0);

    // Test copy button functionality
    await user.click(copyButtons[0]);
    expect(mockWriteText).toHaveBeenCalled();
  });

  it('should show empty state when no token is provided', () => {
    render(<JwtDecoder />);
    
    expect(screen.getByText('🔐')).toBeInTheDocument();
    expect(screen.getByText('Paste a JWT token above to decode and analyze it')).toBeInTheDocument();
    expect(screen.getByText('• View header, payload, and signature separately')).toBeInTheDocument();
    expect(screen.getByText('• See token metadata and expiration status')).toBeInTheDocument();
    expect(screen.getByText('• Copy individual sections')).toBeInTheDocument();
  });

  it('should show algorithm from header', async () => {
    const user = userEvent.setup();
    render(<JwtDecoder />);

    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = { sub: 'test' };
    const jwt = createTestJWT(header, payload);

    const textarea = screen.getByPlaceholderText('Paste your JWT token here...');
    await user.type(textarea, jwt);

    await waitFor(() => {
      expect(screen.getByText('Algorithm:')).toBeInTheDocument();
      expect(screen.getByText('RS256')).toBeInTheDocument();
    });
  });
});