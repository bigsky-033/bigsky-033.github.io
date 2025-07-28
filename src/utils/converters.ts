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