"use client";

import { useEffect, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, updateDoc } from "firebase/firestore";
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
  const [converting, setConverting] = useState(false);
  const [text, setText] = useState<string>("");
  const [chunks, setChunks] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>("");

  useEffect(() => {
    if (text) {
      setChunks(chunkText(text));
    }
  }, [text]);

  const handleUpload = async () => {
    if (!file || !auth.currentUser) return;

    setUploading(true);
    setText("");
    setAudioUrl("");

    try {
      const fileRef = ref(storage, `pdfs/${auth.currentUser.uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      const extractedText = await extractTextFromPDF(file);
      setText(extractedText);

      const docId = `${Date.now()}`;

      await setDoc(doc(db, "audiobooks", docId), {
        title: file.name,
        pdfUrl: url,
        owner: auth.currentUser.uid,
        fullText: extractedText,
        textPreview: extractedText.slice(0, 500),
        audioUrl: "",
        status: "processing",
        createdAt: new Date(),
      });

      setUploading(false);
      setConverting(true);

      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText, docId }),
      });

      if (!res.ok) throw new Error("Conversion API failed");

      const { audioUrl: generatedUrl } = await res.json();

      await updateDoc(doc(db, "audiobooks", docId), {
        audioUrl: generatedUrl,
        status: "ready",
      });

      setAudioUrl(generatedUrl);
      setConverting(false);
      setFile(null);
      alert("Upload and conversion successful!");
    } catch (err) {
      console.error(err);
      setUploading(false);
      setConverting(false);
      alert("Upload failed");
    }
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
        disabled={uploading || converting}
        className="ml-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {uploading ? "Uploading..." : converting ? "Converting to audio..." : "Upload PDF"}
      </button>

      {text && (
        <div className="mt-4 p-3 border rounded max-h-64 overflow-auto text-sm">
          <strong>Extracted Text Preview:</strong>
          <div className="text-xs text-gray-500">Text length: {text.length} chars</div>
          <p className="mt-2 whitespace-pre-wrap">{text.slice(0, 1000)}</p>

          {audioUrl && (
            <div className="mt-3">
              <p className="text-green-600 text-xs font-semibold mb-1">✅ Audio ready (R2)</p>
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}

          {!audioUrl && (
            <div className="mt-3 space-x-2">
              <button onClick={() => speakChunks(chunks, 1)} className="px-3 py-2 bg-green-600 text-white rounded">▶ Play</button>
              <button onClick={() => pauseSpeech()} className="px-3 py-2 bg-yellow-500 text-white rounded">⏸ Pause</button>
              <button onClick={() => resumeSpeech()} className="px-3 py-2 bg-blue-500 text-white rounded">▶ Resume</button>
              <button onClick={() => stopSpeech()} className="px-3 py-2 bg-red-600 text-white rounded">⏹ Stop</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}