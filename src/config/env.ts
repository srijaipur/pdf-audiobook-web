/**
 * =========================================================
 * ENVIRONMENT CONFIGURATION
 * =========================================================
 * Centralized runtime environment management.
 *
 * This file becomes the SINGLE SOURCE OF TRUTH for:
 * - emulator usage
 * - production mode
 * - future staging environments
 * - API routing strategy
 * =========================================================
 */

/**
 * ---------------------------------------------------------
 * Emulator flag
 * ---------------------------------------------------------
 */
export const USE_EMULATOR =
  process.env.NEXT_PUBLIC_USE_EMULATOR === "true";

/**
 * ---------------------------------------------------------
 * Firebase project metadata
 * ---------------------------------------------------------
 */
export const FIREBASE_PROJECT_ID =
  "pdf-audiobook-web-v2";

/**
 * ---------------------------------------------------------
 * Functions region
 * ---------------------------------------------------------
 */
export const FUNCTIONS_REGION =
  "us-central1";

/**
 * ---------------------------------------------------------
 * Base URLs
 * ---------------------------------------------------------
 */
export const LOCAL_FUNCTIONS_BASE_URL =
  `http://localhost:5002/${FIREBASE_PROJECT_ID}/${FUNCTIONS_REGION}`;

export const PROD_FUNCTIONS_BASE_URL =
  `https://${FUNCTIONS_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net`;

/**
 * ---------------------------------------------------------
 * Active Functions Base URL
 * ---------------------------------------------------------
 */
export const FUNCTIONS_BASE_URL =
  USE_EMULATOR
    ? LOCAL_FUNCTIONS_BASE_URL
    : PROD_FUNCTIONS_BASE_URL;