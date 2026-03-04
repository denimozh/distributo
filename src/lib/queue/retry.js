// src/lib/queue/retry.js
// Retry logic for failed operations
// Used for video generation, posting, API calls

// ===========================================
// RETRY WRAPPER
// ===========================================

/**
 * Execute function with exponential backoff retry
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Retry options
 */
export async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000, // 1 second
    maxDelay = 30000, // 30 seconds
    exponentialBase = 2,
    retryIf = () => true, // Function to determine if error should trigger retry
    onRetry = null, // Callback on each retry
    onFinalFailure = null, // Callback when all retries exhausted
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn(attempt);
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!retryIf(error)) {
        throw error;
      }

      // Check if this was the last attempt
      if (attempt === maxAttempts) {
        if (onFinalFailure) {
          await onFinalFailure({ error, attempts: attempt });
        }
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(exponentialBase, attempt - 1) + Math.random() * 1000,
        maxDelay
      );

      if (onRetry) {
        await onRetry({
          attempt,
          delay,
          error,
          nextAttempt: attempt + 1,
          maxAttempts,
        });
      }

      // Wait before next attempt
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep helper
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===========================================
// SPECIALIZED RETRY FUNCTIONS
// ===========================================

/**
 * Retry video generation
 */
export async function retryVideoGeneration(generateFn, options = {}) {
  return withRetry(generateFn, {
    maxAttempts: 3,
    baseDelay: 5000, // 5 seconds
    maxDelay: 60000, // 1 minute
    retryIf: (error) => {
      // Don't retry on validation errors
      if (error.message?.includes("Invalid")) return false;
      if (error.message?.includes("quota")) return false;
      // Retry on network/timeout errors
      return true;
    },
    onRetry: ({ attempt, delay, error }) => {
      console.log(`[Video Generation] Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms`);
    },
    ...options,
  });
}

/**
 * Retry API call to external service
 */
export async function retryApiCall(apiFn, options = {}) {
  return withRetry(apiFn, {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryIf: (error) => {
      // Retry on 5xx errors
      if (error.status >= 500) return true;
      // Retry on network errors
      if (error.message?.includes("fetch")) return true;
      if (error.message?.includes("timeout")) return true;
      if (error.message?.includes("ECONNRESET")) return true;
      // Don't retry on 4xx (client errors)
      if (error.status >= 400 && error.status < 500) return false;
      return true;
    },
    ...options,
  });
}

/**
 * Retry social media posting
 */
export async function retryPosting(postFn, options = {}) {
  return withRetry(postFn, {
    maxAttempts: 3,
    baseDelay: 30000, // 30 seconds (rate limit buffer)
    maxDelay: 300000, // 5 minutes
    retryIf: (error) => {
      // Don't retry on auth errors
      if (error.message?.includes("unauthorized")) return false;
      if (error.message?.includes("token")) return false;
      // Retry on rate limits
      if (error.message?.includes("rate limit")) return true;
      // Retry on server errors
      return true;
    },
    ...options,
  });
}

// ===========================================
// QUEUE MANAGEMENT
// ===========================================

/**
 * Create a retry queue for batch operations
 */
export class RetryQueue {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.concurrency = options.concurrency || 3;
    this.onProgress = options.onProgress || null;
    this.onItemComplete = options.onItemComplete || null;
    this.onItemFailed = options.onItemFailed || null;

    this.queue = [];
    this.results = [];
    this.failed = [];
    this.processing = 0;
    this.completed = 0;
  }

  /**
   * Add items to the queue
   */
  addItems(items) {
    for (const item of items) {
      this.queue.push({
        item,
        attempts: 0,
        lastError: null,
      });
    }
  }

  /**
   * Process the queue
   */
  async process(processFn) {
    const total = this.queue.length;

    const processNext = async () => {
      while (this.queue.length > 0 && this.processing < this.concurrency) {
        const entry = this.queue.shift();
        if (!entry) break;

        this.processing++;

        try {
          entry.attempts++;
          const result = await processFn(entry.item, entry.attempts);
          
          this.results.push({
            item: entry.item,
            result,
            attempts: entry.attempts,
          });

          if (this.onItemComplete) {
            this.onItemComplete({ item: entry.item, result, attempts: entry.attempts });
          }

        } catch (error) {
          entry.lastError = error;

          if (entry.attempts < this.maxAttempts) {
            // Re-queue with delay
            const delay = this.baseDelay * Math.pow(2, entry.attempts - 1);
            setTimeout(() => {
              this.queue.push(entry);
              processNext();
            }, delay);
          } else {
            // Max attempts reached
            this.failed.push({
              item: entry.item,
              error,
              attempts: entry.attempts,
            });

            if (this.onItemFailed) {
              this.onItemFailed({ item: entry.item, error, attempts: entry.attempts });
            }
          }
        }

        this.processing--;
        this.completed++;

        if (this.onProgress) {
          this.onProgress({
            completed: this.completed,
            total,
            succeeded: this.results.length,
            failed: this.failed.length,
            remaining: this.queue.length,
            percent: Math.round((this.completed / total) * 100),
          });
        }
      }
    };

    // Start concurrent workers
    const workers = Array(this.concurrency).fill(null).map(() => processNext());
    await Promise.all(workers);

    // Wait for any remaining items
    while (this.queue.length > 0 || this.processing > 0) {
      await sleep(100);
    }

    return {
      results: this.results,
      failed: this.failed,
      totalProcessed: this.results.length + this.failed.length,
    };
  }
}

// ===========================================
// ERROR CLASSIFICATION
// ===========================================

/**
 * Classify error for retry decision
 */
export function classifyError(error) {
  const message = error.message?.toLowerCase() || "";
  const status = error.status || error.statusCode;

  // Transient errors (should retry)
  if (status >= 500) return { type: "server", retryable: true };
  if (message.includes("timeout")) return { type: "timeout", retryable: true };
  if (message.includes("network")) return { type: "network", retryable: true };
  if (message.includes("rate limit")) return { type: "rate_limit", retryable: true, delay: 60000 };
  if (message.includes("econnreset")) return { type: "connection", retryable: true };
  if (message.includes("temporarily")) return { type: "temporary", retryable: true };

  // Permanent errors (should not retry)
  if (status === 400) return { type: "bad_request", retryable: false };
  if (status === 401) return { type: "unauthorized", retryable: false };
  if (status === 403) return { type: "forbidden", retryable: false };
  if (status === 404) return { type: "not_found", retryable: false };
  if (message.includes("invalid")) return { type: "validation", retryable: false };
  if (message.includes("unauthorized")) return { type: "auth", retryable: false };
  if (message.includes("quota")) return { type: "quota", retryable: false };

  // Unknown - default to retry
  return { type: "unknown", retryable: true };
}

/**
 * Create retry-aware error
 */
export class RetryableError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "RetryableError";
    this.retryable = options.retryable ?? true;
    this.retryDelay = options.retryDelay || null;
    this.originalError = options.originalError || null;
  }
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  withRetry,
  sleep,
  retryVideoGeneration,
  retryApiCall,
  retryPosting,
  RetryQueue,
  classifyError,
  RetryableError,
};
