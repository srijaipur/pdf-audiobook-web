"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UploadPDF from "./UploadPDF";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // -----------------------------
  // STATUS LABELS
  // -----------------------------
  const statusMap: Record<string, string> = {
    pending_approval: "⏳ Waiting for approval",
    approved: "✅ Approved (queued)",
    processing: "🎧 Generating audio",
    ready: "🎵 Ready to play",
  };

  // -----------------------------
  // FETCH USER ROLE
  // -----------------------------
  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    const userSnap = await getDoc(doc(db, "users", user.uid));

    console.log("USER:", user.email);
    console.log("DOC:", userSnap.data());

    // ✅ keep this line
    setIsAdmin(userSnap.data()?.isAdmin || false);
  });

  return () => unsubscribe();
}, []);

  // -----------------------------
  // FETCH AUDIOBOOKS
  // -----------------------------
  useEffect(() => {
    const fetchBooks = async () => {
      const snap = await getDocs(collection(db, "audiobooks"));

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setBooks(data);
    };

    fetchBooks();
  }, []);

  // -----------------------------
  // DELETE (ADMIN ONLY)
  // -----------------------------
  const handleDelete = async (bookId: string) => {
    if (!auth.currentUser) return;

    const userSnap = await getDoc(
  doc(db, "users", auth.currentUser.uid)
);

console.log("UID:", auth.currentUser.uid);
console.log("USER DOC:", userSnap.data());

const admin = userSnap.data()?.isAdmin;

console.log("IS ADMIN:", admin);

    if (!admin) {
      alert("Not authorized");
      return;
    }

    await deleteDoc(doc(db, "audiobooks", bookId));

    setBooks((prev) => prev.filter((b) => b.id !== bookId));

    alert("Deleted successfully");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      {/* HEADER */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-sm text-gray-500">
          Your uploaded and generated audiobooks
        </p>
      </div>

      {/* UPLOAD */}
      <UploadPDF />

      {/* LIST */}
      <div className="mt-8 max-w-3xl mx-auto space-y-4">
        {books.length === 0 && (
          <p className="text-center text-gray-500">
            No audiobooks found.
          </p>
        )}

        {books.map((book) => (
          <div
            key={book.id}
            className="bg-white border rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            {/* LEFT */}
            <div>
              {/* ✅ SHOW ACTUAL FILE NAME */}
              <h2 className="font-semibold text-lg">
                {book.fileName || "Untitled"}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {statusMap[book.status] || book.status}
              </p>

              {book.textPreview && (
                <p className="text-sm text-gray-400 mt-2">
                  {book.textPreview.slice(0, 100)}...
                </p>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 flex-wrap">
              {/* PLAY */}
              {book.audioUrl && (
                <Link
                  href={`/player/${book.id}`}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  ▶ Play
                </Link>
              )}

              {/* DELETE (ADMIN ONLY) */}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(book.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  🗑 Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}