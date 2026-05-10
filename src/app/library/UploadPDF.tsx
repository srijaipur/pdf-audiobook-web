"use client";

import { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "@/lib/firebase";

export default function UploadPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF file");
      return;
    }

    try {
      setLoading(true);
      setStatus("Uploading to storage...");

      const storage = getStorage();
      const fileRef = ref(storage, `uploads/${Date.now()}-${file.name}`);

      // Upload file
      await uploadBytes(fileRef, file);

      // Get URL
      const fileUrl = await getDownloadURL(fileRef);

      setStatus("Submitting for approval...");

      // Call Cloud Function
      const res = await fetch(
        "https://us-central1-pdf-audiobook-web-v2.cloudfunctions.net/requestUpload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
  fileName: file.name,
  fileUrl,
  userId: auth.currentUser?.uid || "anonymous",
  userEmail: auth.currentUser?.email || "unknown",
}),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setStatus("✅ Submitted! Awaiting admin approval.");
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-xl shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-2 text-center">
        Upload PDF
      </h2>

      <p className="text-sm text-gray-500 mb-4 text-center">
        Your file will be reviewed before audiobook generation.
      </p>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
          }
        }}
        className="mb-3 w-full"
      />

      {file && (
        <p className="text-sm mb-3">
          Selected: <strong>{file.name}</strong>
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Upload for Approval"}
      </button>

      {status && (
        <p className="mt-4 text-sm text-center">{status}</p>
      )}
    </div>
  );
}