"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";

export default function PlayerPage() {
  const { id } = useParams();

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // LOAD AUDIOBOOK
  // -----------------------------
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const ref = doc(db, "audiobooks", id as string);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.error("❌ Book not found");
          setLoading(false);
          return;
        }

        const data = snap.data();

        console.log("🔥 FIRESTORE DATA:", data);

        const audio = data.audioUrl;

        if (!audio) {
          console.warn("⏳ Audio not ready yet");
          setAudioUrl(null);
        } else {
          setAudioUrl(audio);
        }

        setTitle(data.fileName || "Untitled");
      } catch (err) {
        console.error("❌ Error loading book:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  // -----------------------------
  // LOADING STATE
  // -----------------------------
  if (loading) {
    return <div className="p-6">Loading audiobook...</div>;
  }

  // -----------------------------
  // AUDIO NOT READY
  // -----------------------------
  if (!audioUrl) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold mb-4">{title}</h1>
        <p className="text-gray-500">
          🎧 Audio is still being generated. Please check back later.
        </p>
      </div>
    );
  }

  // -----------------------------
  // AUDIO PLAYER
  // -----------------------------
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">{title}</h1>

      <audio controls className="w-full">
        <source src={audioUrl} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}