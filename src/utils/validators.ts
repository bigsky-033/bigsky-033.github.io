export const validateJson = (input: string): { isValid: boolean; error?: string } => {
  try {
    JSON.parse(input);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON' 
    };
  }
};

export const isBase64 = (input: string): boolean => {
  try {
    return btoa(atob(input)) === input;
  } catch {
    return false;
  }
};

export const isJWT = (input: string): boolean => {
  const parts = input.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};