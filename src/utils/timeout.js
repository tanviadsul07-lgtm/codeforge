/**
 * Promise wrapper that rejects if the promise does not resolve within the specified timeout.
 */
export const withTimeout = (promise, timeoutMs = 12000, operationName = 'Operation') => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`${operationName} timed out after ${timeoutMs / 1000}s. Please check network connection.`);
      error.code = 'auth/timeout';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};
