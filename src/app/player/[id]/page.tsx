"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";

export default function PlayerPage() {
  const { id } = useParams();

  const [book, setBook] = useState<any>(null);
  const [chunks, setChunks] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // -----------------------------
  // LOAD FROM FIRESTORE
  // -----------------------------
  useEffect(() => {
    const fetchBook = async () => {
      const ref = doc(db, "audiobooks", id as string);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.error("Book not found");
        return;
      }

      const data = snap.data();

      console.log("🔥 FIRESTORE DATA:", data);

      // ✅ BEST PRACTICE: ONLY fullText allowed
      const text = data.fullText;

      if (!text) {
        console.error("❌ Missing fullText in Firestore document");
        return;
      }

      setBook(data);

      // -----------------------------
      // CLEAN CHUNKING LOGIC
      // -----------------------------
      const split = text
        .replace(/\n/g, " ")
        .split(/(?<=[.?!])\s+/)
        .map((s: string) => s.trim())
        .filter(Boolean);

      console.log("📦 CHUNKS CREATED:", split.length);

      setChunks(split);
    };

    fetchBook();
  }, [id]);

  // -----------------------------
  // PLAY CURRENT CHUNK
  // -----------------------------
  const playCurrent = () => {
    if (!chunks.length) {
      console.warn("⚠️ No chunks available");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      chunks[currentIndex]
    );

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  // -----------------------------
  // CONTROLS
  // -----------------------------
  const next = () => {
    setCurrentIndex((prev) =>
      Math.min(prev + 1, chunks.length - 1)
    );
  };

  const prev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const resume = () => {
    window.speechSynthesis.resume();
  };

  const pause = () => {
    window.speechSynthesis.pause();
  };

  // -----------------------------
  // LOADING STATE
  // -----------------------------
  if (!book) {
    return <div className="p-6">Loading audiobook...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">{book.title}</h1>

      {/* CONTROLS */}
      <div className="mt-4 space-x-2">
        <button
          onClick={playCurrent}
          className="px-3 py-2 bg-green-600 text-white rounded"
        >
          ▶ Play
        </button>

        <button
          onClick={prev}
          className="px-3 py-2 bg-gray-500 text-white rounded"
        >
          ⏮ Prev
        </button>

        <button
          onClick={next}
          className="px-3 py-2 bg-gray-500 text-white rounded"
        >
          ⏭ Next
        </button>

        <button
          onClick={pause}
          className="px-3 py-2 bg-yellow-500 text-white rounded"
        >
          ⏸ Pause
        </button>

        <button
          onClick={resume}
          className="px-3 py-2 bg-blue-500 text-white rounded"
        >
          ▶ Resume
        </button>

        <button
          onClick={stop}
          className="px-3 py-2 bg-red-600 text-white rounded"
        >
          ⏹ Stop
        </button>
      </div>

      {/* PROGRESS */}
      <div className="mt-4 text-sm text-gray-600">
        Chunk: {currentIndex + 1} / {chunks.length}
      </div>

      {/* TEXT DISPLAY */}
      <div className="mt-6 border p-3 rounded max-h-64 overflow-auto text-sm">
        {chunks.map((chunk, i) => (
          <p
            key={i}
            className={
              i === currentIndex ? "bg-yellow-200" : ""
            }
          >
            {chunk}
          </p>
        ))}
      </div>
    </div>
  );
}