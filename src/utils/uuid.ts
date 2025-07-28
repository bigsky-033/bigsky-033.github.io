// UUID generation utilities supporting v1, v4, and v5 variants

export type UuidVersion = 'v1' | 'v4' | 'v5';
export type UuidFormat = 'standard' | 'no-dashes' | 'uppercase' | 'uppercase-no-dashes';

/**
 * Generate a v4 (random) UUID
 */
export const generateV4Uuid = (): string => {
  // Use crypto.getRandomValues for cryptographically secure random numbers
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);

  // Set version (4) and variant bits according to RFC 4122
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // Version 4
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // Variant 10

  // Convert to hex string with dashes
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
};

/**
 * Generate a v1 (timestamp-based) UUID
 */
export const generateV1Uuid = (): string => {
  const now = Date.now();
  const timeHex = (now * 10000 + 0x01b21dd213814000).toString(16).padStart(16, '0');
  
  // Generate random node identifier (6 bytes)
  const node = new Uint8Array(6);
  crypto.getRandomValues(node);
  node[0] |= 0x01; // Set multicast bit to indicate random node

  // Generate random clock sequence (2 bytes)
  const clockSeq = new Uint8Array(2);
  crypto.getRandomValues(clockSeq);
  clockSeq[0] = (clockSeq[0] & 0x3f) | 0x80; // Set variant bits

  // Construct UUID parts
  const timeLow = timeHex.slice(-8);
  const timeMid = timeHex.slice(-12, -8);
  const timeHiAndVersion = (parseInt(timeHex.slice(-16, -12), 16) & 0x0fff | 0x1000).toString(16).padStart(4, '0');
  const clockSeqHex = Array.from(clockSeq).map(b => b.toString(16).padStart(2, '0')).join('');
  const nodeHex = Array.from(node).map(b => b.toString(16).padStart(2, '0')).join('');

  return [timeLow, timeMid, timeHiAndVersion, clockSeqHex, nodeHex].join('-');
};

/**
 * Generate a v5 (namespace-based SHA-1) UUID
 */
export const generateV5Uuid = async (namespace: string, name: string): Promise<string> => {
  // Convert namespace UUID to bytes (if it's a valid UUID)
  let namespaceBytes: Uint8Array;
  
  if (isValidUuid(namespace)) {
    const hex = namespace.replace(/-/g, '');
    namespaceBytes = new Uint8Array(hex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  } else {
    // Use namespace as-is if not a valid UUID
    namespaceBytes = new TextEncoder().encode(namespace);
  }

  // Combine namespace and name
  const nameBytes = new TextEncoder().encode(name);
  const combined = new Uint8Array(namespaceBytes.length + nameBytes.length);
  combined.set(namespaceBytes);
  combined.set(nameBytes, namespaceBytes.length);

  // Generate SHA-1 hash
  const hashBuffer = await crypto.subtle.digest('SHA-1', combined);
  const hashBytes = new Uint8Array(hashBuffer);

  // Set version (5) and variant bits
  hashBytes[6] = (hashBytes[6] & 0x0f) | 0x50; // Version 5
  hashBytes[8] = (hashBytes[8] & 0x3f) | 0x80; // Variant 10

  // Convert to hex string with dashes (only use first 16 bytes)
  const hex = Array.from(hashBytes.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
};

/**
 * Generate UUID based on version
 */
export const generateUuid = async (
  version: UuidVersion,
  namespace?: string,
  name?: string
): Promise<string> => {
  switch (version) {
    case 'v1':
      return generateV1Uuid();
    case 'v4':
      return generateV4Uuid();
    case 'v5':
      if (!namespace || !name) {
        throw new Error('v5 UUIDs require both namespace and name parameters');
      }
      return await generateV5Uuid(namespace, name);
    default:
      throw new Error(`Unsupported UUID version: ${version}`);
  }
};

/**
 * Generate multiple UUIDs
 */
export const generateBulkUuids = async (
  count: number,
  version: UuidVersion,
  namespace?: string,
  name?: string
): Promise<string[]> => {
  if (count <= 0 || count > 1000) {
    throw new Error('Count must be between 1 and 1000');
  }

  const uuids: string[] = [];
  
  if (version === 'v5' && namespace && name) {
    // For v5, generate variations by appending index to name
    for (let i = 0; i < count; i++) {
      const indexedName = count === 1 ? name : `${name}_${i}`;
      uuids.push(await generateV5Uuid(namespace, indexedName));
    }
  } else {
    // For v1 and v4, generate fresh UUIDs
    for (let i = 0; i < count; i++) {
      uuids.push(await generateUuid(version, namespace, name));
    }
  }

  return uuids;
};

/**
 * Format UUID according to specified format
 */
export const formatUuid = (uuid: string, format: UuidFormat): string => {
  const cleanUuid = uuid.replace(/-/g, '');
  
  switch (format) {
    case 'standard':
      return [
        cleanUuid.slice(0, 8),
        cleanUuid.slice(8, 12),
        cleanUuid.slice(12, 16),
        cleanUuid.slice(16, 20),
        cleanUuid.slice(20, 32)
      ].join('-').toLowerCase();
    case 'no-dashes':
      return cleanUuid.toLowerCase();
    case 'uppercase':
      return [
        cleanUuid.slice(0, 8),
        cleanUuid.slice(8, 12),
        cleanUuid.slice(12, 16),
        cleanUuid.slice(16, 20),
        cleanUuid.slice(20, 32)
      ].join('-').toUpperCase();
    case 'uppercase-no-dashes':
      return cleanUuid.toUpperCase();
    default:
      return uuid;
  }
};

/**
 * Validate if a string is a valid UUID
 */
export const isValidUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Parse UUID and extract version and other information
 */
export const parseUuid = (uuid: string): {
  version: number;
  variant: string;
  isValid: boolean;
  timestamp?: Date;
} => {
  if (!isValidUuid(uuid)) {
    return { version: 0, variant: 'invalid', isValid: false };
  }

  const hex = uuid.replace(/-/g, '');
  const version = parseInt(hex[12], 16);
  const variantBits = parseInt(hex[16], 16);
  
  let variant = 'unknown';
  if ((variantBits & 0x8) === 0) {
    variant = 'NCS backward compatibility';
  } else if ((variantBits & 0xc) === 0x8) {
    variant = 'RFC 4122';
  } else if ((variantBits & 0xe) === 0xc) {
    variant = 'Microsoft backward compatibility';
  } else {
    variant = 'Reserved for future use';
  }

  const result: ReturnType<typeof parseUuid> = {
    version,
    variant,
    isValid: true
  };

  // For v1 UUIDs, extract timestamp
  if (version === 1) {
    try {
      const timeLow = parseInt(hex.slice(0, 8), 16);
      const timeMid = parseInt(hex.slice(8, 12), 16);
      const timeHi = parseInt(hex.slice(12, 16), 16) & 0x0fff;
      
      const timestamp = (timeHi * Math.pow(2, 32) + timeMid * Math.pow(2, 16) + timeLow - 0x01b21dd213814000) / 10000;
      result.timestamp = new Date(timestamp);
    } catch {
      // Ignore timestamp parsing errors
    }
  }

  return result;
};

/**
 * Get UUID version information
 */
export const getUuidVersionInfo = (version: UuidVersion) => {
  const info = {
    'v1': {
      name: 'Version 1',
      description: 'Time-based UUID with MAC address',
      secure: false,
      note: 'Contains timestamp and MAC address - not recommended for security-sensitive applications'
    },
    'v4': {
      name: 'Version 4',
      description: 'Random UUID',
      secure: true,
      note: 'Cryptographically secure random UUID - recommended for most use cases'
    },
    'v5': {
      name: 'Version 5',
      description: 'Namespace-based UUID using SHA-1',
      secure: true,
      note: 'Deterministic UUID based on namespace and name - same inputs always produce same UUID'
    }
  };

  return info[version];
};

/**
 * Common UUID namespaces (RFC 4122)
 */
export const UUID_NAMESPACES = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8'
};