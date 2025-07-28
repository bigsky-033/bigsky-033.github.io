export const formatJson = (input: string, indent: number = 2): string => {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, indent);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

export const minifyJson = (input: string): string => {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

export const sortJsonKeys = (input: string, indent: number = 2): string => {
  try {
    const parsed = JSON.parse(input);
    const sortedJson = sortObjectKeys(parsed);
    return JSON.stringify(sortedJson, null, indent);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

const sortObjectKeys = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: any = {};
  
  for (const key of sortedKeys) {
    sortedObj[key] = sortObjectKeys(obj[key]);
  }
  
  return sortedObj;
};