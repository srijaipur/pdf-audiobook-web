export function getRequestUploadUrl() {
  const useEmulator =
    process.env.NEXT_PUBLIC_USE_EMULATOR === "true";

  if (useEmulator) {
    return "http://127.0.0.1:5002/pdf-audiobook-web-v2/us-central1/requestUpload";
  }

  return "https://us-central1-pdf-audiobook-web-v2.cloudfunctions.net/requestUpload";
}