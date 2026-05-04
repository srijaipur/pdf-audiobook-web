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
  // FETCH USER + ADMIN CHECK
  // -----------------------------
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!auth.currentUser) return;

      const userSnap = await getDoc(
        doc(db, "users", auth.currentUser.uid)
      );

      setIsAdmin(userSnap.data()?.isAdmin || false);
    };

    fetchUserRole();
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

    const admin = userSnap.data()?.isAdmin;

    if (!admin) {
      alert("Not authorized");
      return;
    }

    await deleteDoc(doc(db, "audiobooks", bookId));

    setBooks((prev) => prev.filter((b) => b.id !== bookId));

    alert("Deleted successfully");
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <h1 className="text-xl font-bold mb-4">Library</h1>

      {/* UPLOAD SECTION */}
      <UploadPDF />

      {/* LIST */}
      <div className="mt-6 space-y-3">
        {books.length === 0 && (
          <p className="text-gray-500">No audiobooks found.</p>
        )}

        {books.map((book) => (
          <div
            key={book.id}
            className="border p-3 rounded flex justify-between items-center"
          >
            {/* TITLE */}
            <div>
              <h2 className="font-semibold">{book.title}</h2>
              <p className="text-sm text-gray-500">
                {book.textPreview?.slice(0, 80)}
              </p>
            </div>

            {/* ACTIONS */}
            <div className="space-x-2">
              {/* PLAY */}
              <Link
                href={`/player/${book.id}`}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                ▶ Play
              </Link>

              {/* DELETE (ADMIN ONLY) */}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(book.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
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