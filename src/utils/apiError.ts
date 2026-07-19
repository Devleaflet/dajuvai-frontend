import axios from 'axios';

/**
 * One place to pull a human-readable message out of any error shape this
 * codebase throws — axios errors, the backend's normalized
 * { success, errorCode, message, errors } envelope, or a plain Error.
 * Replaces the repeated, inconsistent
 *   error.response?.data?.message || error.response?.data?.error || error.message
 * scattered across catch blocks.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; error?: string; errors?: Array<{ field?: string; message?: string }> }
      | undefined;

    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (data?.errors?.length) {
      const first = data.errors[0];
      return first.message || (first.field ? `Invalid value for ${first.field}` : fallback);
    }
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (!error.response) return 'Network error — please check your connection.';
    return fallback;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}

/** For the fetch()-based call sites: pass the already-parsed JSON body. */
export function getFetchErrorMessage(
  body: { message?: string; error?: string; errors?: Array<{ field?: string; message?: string }> } | undefined,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (body?.message) return body.message;
  if (body?.error) return body.error;
  if (body?.errors?.length) {
    const first = body.errors[0];
    return first.message || (first.field ? `Invalid value for ${first.field}` : fallback);
  }
  return fallback;
}
