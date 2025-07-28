export const encodeBase64 = (input: string): string => {
  return btoa(unescape(encodeURIComponent(input)));
};

export const decodeBase64 = (input: string): string => {
  try {
    return decodeURIComponent(escape(atob(input)));
  } catch (error) {
    throw new Error('Invalid Base64 string');
  }
};

export const decodeJWT = (token: string): { header: any; payload: any; signature: string } => {
  const parts = token.split('.');
  
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token');
  }
  
  try {
    const header = JSON.parse(decodeBase64(parts[0] + '=='.substring(0, (4 - parts[0].length % 4) % 4)));
    const payload = JSON.parse(decodeBase64(parts[1] + '=='.substring(0, (4 - parts[1].length % 4) % 4)));
    const signature = parts[2];
    
    return { header, payload, signature };
  } catch (error) {
    throw new Error('Failed to decode JWT token');
  }
};

export const encodeURL = (input: string): string => {
  return encodeURIComponent(input);
};

export const decodeURL = (input: string): string => {
  try {
    return decodeURIComponent(input);
  } catch (error) {
    throw new Error('Invalid URL encoded string');
  }
};