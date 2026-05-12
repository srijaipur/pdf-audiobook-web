/**
 * =======================================================
 * Firebase Functions Entry Point
 * =======================================================
 *
 * Responsibilities:
 *  - initialize Firebase Admin ONCE
 *  - export all Firebase functions
 *
 * NO business logic belongs here.
 * =======================================================
 */

import * as admin from "firebase-admin";

/**
 * -------------------------------------------------------
 * Initialize Firebase Admin
 * -------------------------------------------------------
 */
admin.initializeApp();

/**
 * -------------------------------------------------------
 * HTTP Functions
 * -------------------------------------------------------
 */
export {
  requestUpload,
} from "./httpFunctions";

/**
 * -------------------------------------------------------
 * Background Processing
 * -------------------------------------------------------
 */
export {
  generateAudio,
} from "./backgroundFunctions";

/**
 * -------------------------------------------------------
 * TTS Workers
 * -------------------------------------------------------
 */
export {
  processTTSChunk,
} from "./ttsWorker";

/**
 * -------------------------------------------------------
 * Aggregation Workers
 * -------------------------------------------------------
 */
export {
  aggregateAudiobookStatus,
} from "./aggregationWorker";