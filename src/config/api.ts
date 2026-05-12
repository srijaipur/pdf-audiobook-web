import { FUNCTIONS_BASE_URL } from "./env";

/**
 * =========================================================
 * API ENDPOINT REGISTRY
 * =========================================================
 * Centralized endpoint definitions.
 *
 * NO hardcoded URLs should exist anywhere else
 * in the application.
 * =========================================================
 */

export const API_ENDPOINTS = {
  /**
   * -------------------------------------------------------
   * Upload request
   * -------------------------------------------------------
   */
  requestUpload:
    `${FUNCTIONS_BASE_URL}/requestUpload`,
};