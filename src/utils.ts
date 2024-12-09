export const safeJSONParse = <T>(jsonString: string): T | null => {
  try {
    return JSON.parse(jsonString) as T; // Cast to T
  } catch (error) {
    console.error('JSON Parse Error:', error);
    return null; // Return null or handle as needed
  }
};

export const handleError = (error: unknown, context: string) => {
  if (error instanceof Error) {
    console.error(`${context}: ${error.message}`);
  } else {
    console.error(`${context}: ${String(error)}`);
  }
};
