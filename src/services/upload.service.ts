import { API_ENDPOINTS } from "@/config/api";
import { apiFetch } from "@/lib/fetcher";

/**
 * =========================================================
 * UPLOAD SERVICE
 * =========================================================
 * Handles all upload-related backend communication.
 *
 * UI components should NEVER directly call fetch().
 * =========================================================
 */

interface UploadRequestPayload {
  fileName: string;
  fileUrl: string;
  userId: string;
  userEmail?: string;
}

/**
 * ---------------------------------------------------------
 * Submit upload request
 * ---------------------------------------------------------
 */
export async function submitUploadRequest(
  payload: UploadRequestPayload
) {
  console.log(
    "🚀 Using function URL:",
    API_ENDPOINTS.requestUpload
  );

  return apiFetch(
    API_ENDPOINTS.requestUpload,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}