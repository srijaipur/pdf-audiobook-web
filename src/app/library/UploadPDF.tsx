"use client";

import { useEffect, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase";
import { extractTextFromPDF } from "@/lib/pdfReader";
import {
  speakChunks,
  pauseSpeech,
  resumeSpeech,
  stopSpeech,
} from "@/lib/speechEngine";
import { chunkText } from "@/lib/textChunker";

export default function UploadPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [text, setText] = useState<string>("");
  const [chunks, setChunks] = useState<string[]>([]);

  useEffect(() => {
    if (text) {
      setChunks(chunkText(text));
    }
  }, [text]);

  const handleUpload = async () => {
    if (!file || !auth.currentUser) return;

    setUploading(true);
    setText("");

    try {
      // Upload file
      const fileRef = ref(
        storage,
        `pdfs/${auth.currentUser.uid}/${file.name}`
      );

      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      // Extract text
      const extractedText = await extractTextFromPDF(file);
      setText(extractedText);

      // Save metadata
    await setDoc(doc(db, "audiobooks", `${Date.now()}`), {
  title: file.name,
  pdfUrl: url,
  owner: auth.currentUser.uid,

  // ✅ FULL TEXT (CRITICAL FOR PLAYER)
  fullText: extractedText,

  // fallback preview (still useful for UI)
  textPreview: extractedText.slice(0, 500),

  createdAt: new Date(),
});

      alert("Upload successful!");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }

    setUploading(false);
  };

  return (
    <div className="border p-4 rounded mt-4">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {uploading ? "Processing..." : "Upload PDF"}
      </button>

      {/* TEXT PREVIEW */}
      {text && (
        <div className="mt-4 p-3 border rounded max-h-64 overflow-auto text-sm">
          <strong>Extracted Text Preview:</strong>

           {/* DEBUG LINE (ADD THIS) */}
         <div className="text-xs text-gray-500">
              Debug text length: {text.length}
            </div>

          <p className="mt-2 whitespace-pre-wrap">
            {text.slice(0, 1000)}
          </p>

          {/* AUDIO CONTROLS */}
          <div className="mt-3 space-x-2">
            <button
              onClick={() => speakChunks(chunks, 1)}
              className="px-3 py-2 bg-green-600 text-white rounded"
            >
              ▶ Play
            </button>

            <button
              onClick={() => pauseSpeech()}
              className="px-3 py-2 bg-yellow-500 text-white rounded"
            >
              ⏸ Pause
            </button>

            <button
              onClick={() => resumeSpeech()}
              className="px-3 py-2 bg-blue-500 text-white rounded"
            >
              ▶ Resume
            </button>

            <button
              onClick={() => stopSpeech()}
              className="px-3 py-2 bg-red-600 text-white rounded"
            >
              ⏹ Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}