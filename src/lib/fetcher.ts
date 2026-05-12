/**
 * =========================================================
 * CENTRALIZED FETCH UTILITY
 * =========================================================
 * This layer becomes the future foundation for:
 * - auth token injection
 * - RBAC headers
 * - request tracing
 * - retry logic
 * - observability
 * - centralized error handling
 * =========================================================
 */

export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  /**
   * -------------------------------------------------------
   * Default headers
   * -------------------------------------------------------
   */
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  /**
   * -------------------------------------------------------
   * Execute request
   * -------------------------------------------------------
   */
  const response = await fetch(url, {
    ...options,
    headers,
  });

  /**
   * -------------------------------------------------------
   * Parse JSON safely
   * -------------------------------------------------------
   */
  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  /**
   * -------------------------------------------------------
   * Standardized error handling
   * -------------------------------------------------------
   */
  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}