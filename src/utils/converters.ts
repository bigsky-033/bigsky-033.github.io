export const encodeBase64 = (input: string): string => {
  return btoa(unescape(encodeURIComponent(input)));
};

export const decodeBase64 = (input: string): string => {
  try {
    return decodeURIComponent(escape(atob(input)));
  } catch {
    throw new Error('Invalid Base64 string');
  }
};

export const encodeBase64UrlSafe = (input: string): string => {
  return encodeBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

export const decodeBase64UrlSafe = (input: string): string => {
  try {
    // Add padding if needed
    let padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = 4 - (padded.length % 4);
    if (padding !== 4) {
      padded += '='.repeat(padding);
    }
    return decodeBase64(padded);
  } catch {
    throw new Error('Invalid URL-safe Base64 string');
  }
};

export const detectBase64Type = (input: string): 'standard' | 'url-safe' | 'invalid' => {
  if (!input || input.length < 4) {
    return 'invalid';
  }
  
  // Check for standard Base64 first (contains +, /, or = characters)
  if (/[+/=]/.test(input) && /^[A-Za-z0-9+/]+=*$/.test(input)) {
    try {
      decodeBase64(input);
      return 'standard';
    } catch {
      return 'invalid';
    }
  }
  
  // Check for URL-safe Base64 (no +, /, or = characters, but contains - or _)
  if (/[-_]/.test(input) && /^[A-Za-z0-9_-]+$/.test(input)) {
    try {
      decodeBase64UrlSafe(input);
      return 'url-safe';
    } catch {
      return 'invalid';
    }
  }
  
  // Check if it could be either (only contains A-Za-z0-9)
  if (/^[A-Za-z0-9]+$/.test(input)) {
    // Try standard first, then URL-safe
    try {
      decodeBase64(input);
      return 'standard';
    } catch {
      try {
        decodeBase64UrlSafe(input);
        return 'url-safe';
      } catch {
        return 'invalid';
      }
    }
  }
  
  return 'invalid';
};

export const decodeJWT = (token: string): { header: Record<string, unknown>; payload: Record<string, unknown>; signature: string } => {
  const parts = token.split('.');
  
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token - must have 3 parts separated by dots');
  }
  
  try {
    // Add padding if needed for base64 decoding
    const addPadding = (str: string) => {
      const padding = 4 - (str.length % 4);
      return padding === 4 ? str : str + '='.repeat(padding);
    };
    
    const header = JSON.parse(decodeBase64(addPadding(parts[0]))) as Record<string, unknown>;
    const payload = JSON.parse(decodeBase64(addPadding(parts[1]))) as Record<string, unknown>;
    const signature = parts[2];
    
    return { header, payload, signature };
  } catch {
    throw new Error('Failed to decode JWT token - invalid base64 or JSON format');
  }
};

export const formatJWTMetadata = (payload: Record<string, unknown>) => {
  const metadata: Record<string, string | number | boolean> = {};
  
  // Standard JWT claims
  if (payload.iss) metadata['Issuer (iss)'] = String(payload.iss);
  if (payload.sub) metadata['Subject (sub)'] = String(payload.sub);
  if (payload.aud) metadata['Audience (aud)'] = Array.isArray(payload.aud) ? payload.aud.join(', ') : String(payload.aud);
  if (payload.exp) {
    const exp = Number(payload.exp);
    metadata['Expires At (exp)'] = new Date(exp * 1000).toISOString();
    metadata['Expires At (readable)'] = new Date(exp * 1000).toLocaleString();
  }
  if (payload.nbf) {
    const nbf = Number(payload.nbf);
    metadata['Not Before (nbf)'] = new Date(nbf * 1000).toISOString();
    metadata['Not Before (readable)'] = new Date(nbf * 1000).toLocaleString();
  }
  if (payload.iat) {
    const iat = Number(payload.iat);
    metadata['Issued At (iat)'] = new Date(iat * 1000).toISOString();
    metadata['Issued At (readable)'] = new Date(iat * 1000).toLocaleString();
  }
  if (payload.jti) metadata['JWT ID (jti)'] = String(payload.jti);
  
  return metadata;
};

export const isJWTExpired = (payload: Record<string, unknown>): boolean => {
  if (!payload.exp) return false;
  const exp = Number(payload.exp);
  return Date.now() >= exp * 1000;
};

export const encodeURL = (input: string): string => {
  return encodeURIComponent(input);
};

export const decodeURL = (input: string): string => {
  try {
    return decodeURIComponent(input);
  } catch {
    throw new Error('Invalid URL encoded string');
  }
};

export const encodeURIFull = (input: string): string => {
  return encodeURI(input);
};

export const decodeURIFull = (input: string): string => {
  try {
    return decodeURI(input);
  } catch {
    throw new Error('Invalid URI encoded string');
  }
};

export const parseQueryString = (queryString: string): Record<string, string> => {
  const params: Record<string, string> = {};
  
  // Remove leading ? if present
  const cleanQuery = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  
  if (!cleanQuery) return params;
  
  const pairs = cleanQuery.split('&');
  
  for (const pair of pairs) {
    const [key, value = ''] = pair.split('=');
    if (key) {
      try {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      } catch {
        // If decoding fails, use raw values
        params[key] = value;
      }
    }
  }
  
  return params;
};

export const buildQueryString = (params: Record<string, string>): string => {
  const encoded = Object.entries(params)
    .filter(([key]) => key !== '') // Don't trim, just check for empty string
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return encoded ? `?${encoded}` : '';
};

export const isValidURL = (input: string): boolean => {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
};

export const detectURLEncoding = (input: string): 'encoded' | 'decoded' | 'unknown' => {
  // Check for URL encoded characters like %20, %21, etc.
  if (/%[0-9A-Fa-f]{2}/.test(input)) {
    return 'encoded';
  }
  
  // Check for characters that would typically be encoded
  if (/[ <>"`{}|\\^[\]@#$&()=;+,?]/.test(input)) {
    return 'decoded';
  }
  
  return 'unknown';
};

// ASCII/Unicode conversion functions
export const textToAsciiCodes = (text: string, format: 'decimal' | 'hex' | 'octal' | 'binary'): string[] => {
  return Array.from(text).map(char => {
    const code = char.charCodeAt(0);
    switch (format) {
      case 'decimal':
        return code.toString();
      case 'hex':
        return code.toString(16).toUpperCase();
      case 'octal':
        return code.toString(8);
      case 'binary':
        return code.toString(2);
      default:
        return code.toString();
    }
  });
};

export const asciiCodesToText = (codes: string[], format: 'decimal' | 'hex' | 'octal' | 'binary'): string => {
  return codes.map(code => {
    let num: number;
    switch (format) {
      case 'decimal':
        num = parseInt(code, 10);
        break;
      case 'hex':
        num = parseInt(code, 16);
        break;
      case 'octal':
        num = parseInt(code, 8);
        break;
      case 'binary':
        num = parseInt(code, 2);
        break;
      default:
        num = parseInt(code, 10);
    }
    return isNaN(num) ? '' : String.fromCharCode(num);
  }).join('');
};

export const textToUnicodeCodes = (text: string): string[] => {
  return Array.from(text).map(char => {
    const code = char.codePointAt(0) || char.charCodeAt(0);
    return `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
  });
};

export const unicodeCodesToText = (codes: string[]): string => {
  return codes.map(code => {
    // Handle U+XXXX format
    const match = code.match(/U\+([0-9A-Fa-f]+)/);
    if (match) {
      const num = parseInt(match[1], 16);
      return isNaN(num) ? '' : String.fromCodePoint(num);
    }
    // Handle plain hex numbers
    const num = parseInt(code, 16);
    return isNaN(num) ? '' : String.fromCodePoint(num);
  }).join('');
};

export const textToEscapeSequences = (text: string): string => {
  return text.replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\f/g, '\\f')
    .replace(/\x08/g, '\\b')
    .replace(/\v/g, '\\v')
    .replace(/\0/g, '\\0');
};

export const escapeSequencesToText = (text: string): string => {
  return text.replace(/\\u([0-9A-Fa-f]{4,6})/g, (_, hex) => {
      const codePoint = parseInt(hex, 16);
      return codePoint > 0xFFFF ? String.fromCodePoint(codePoint) : String.fromCharCode(codePoint);
    })
    .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\f/g, '\f')
    .replace(/\\b/g, '\x08')
    .replace(/\\v/g, '\v')
    .replace(/\\0/g, '\0')
    .replace(/\\\\/g, '\\');
};

export const textToHtmlEntities = (text: string): string => {
  return text.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/[\u00A0-\u9999]/g, (match) => `&#${match.charCodeAt(0)};`);
};

export const htmlEntitiesToText = (text: string): string => {
  return text.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, entity) => {
      // Common HTML entities
      const entities: Record<string, string> = {
        'nbsp': '\u00A0',
        'copy': '©',
        'reg': '®',
        'trade': '™',
        'hellip': '…',
        'mdash': '—',
        'ndash': '–',
        'lsquo': '\u2018',
        'rsquo': '\u2019',
        'ldquo': '\u201C',
        'rdquo': '\u201D'
      };
      return entities[entity] || match;
    });
};

export const analyzeCharacterFrequency = (text: string): Array<{ char: string; count: number; percentage: number }> => {
  const charCount: Record<string, number> = {};
  const totalChars = text.length;
  
  for (const char of text) {
    charCount[char] = (charCount[char] || 0) + 1;
  }
  
  return Object.entries(charCount)
    .map(([char, count]) => ({
      char,
      count,
      percentage: totalChars > 0 ? (count / totalChars) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);
};

export const detectTextEncoding = (text: string): string => {
  // Simple heuristic-based encoding detection
  // eslint-disable-next-line no-control-regex
  const hasNonAscii = /[^\x00-\x7F]/.test(text);
  const hasHighUnicode = /[\u0100-\uFFFF]/.test(text);
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(text);
  
  if (hasEmoji || hasHighUnicode) {
    return 'UTF-8/UTF-16 (Unicode)';
  } else if (hasNonAscii) {
    return 'Extended ASCII/Latin-1';
  } else {
    return 'ASCII';
  }
};

export const getCharacterInfo = (char: string): {
  char: string;
  name: string;
  decimal: number;
  hex: string;
  octal: string;
  binary: string;
  unicode: string;
  category: string;
} => {
  const code = char.codePointAt(0) || char.charCodeAt(0);
  
  // Simple character categorization
  let category = 'Unknown';
  if (code >= 32 && code <= 126) category = 'ASCII Printable';
  else if (code < 32) category = 'ASCII Control';
  else if (code >= 128 && code <= 255) category = 'Extended ASCII';
  else if (code >= 256) category = 'Unicode';
  
  // Simple character names for common characters
  const commonNames: Record<number, string> = {
    32: 'Space',
    33: 'Exclamation Mark',
    34: 'Quotation Mark',
    35: 'Number Sign',
    36: 'Dollar Sign',
    37: 'Percent Sign',
    38: 'Ampersand',
    39: 'Apostrophe',
    40: 'Left Parenthesis',
    41: 'Right Parenthesis',
    9: 'Tab',
    10: 'Line Feed',
    13: 'Carriage Return',
    0: 'Null'
  };
  
  const name = commonNames[code] || `Character ${code}`;
  
  return {
    char,
    name,
    decimal: code,
    hex: code.toString(16).toUpperCase(),
    octal: code.toString(8),
    binary: code.toString(2),
    unicode: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
    category
  };
};