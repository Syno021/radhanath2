const generateTimestamp = (): string => {
  return Date.now().toString(36).slice(-4);
};

const generateRandomChars = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
};

export const generateBookId = (): string => {
  const timestamp = generateTimestamp();
  const random = generateRandomChars(3);
  return `B${timestamp}${random}`;
};

export const generateUserId = (): string => {
  const timestamp = generateTimestamp();
  const random = generateRandomChars(3);
  return `U${timestamp}${random}`;
};
