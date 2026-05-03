"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  console.log("Firebase auth listener starting...");

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("AUTH STATE:", user);

    if (user) {
      router.replace("/library");
    } else {
      setLoading(false);
    }
  });

  return () => unsubscribe();
}, [router]);

  const handleSignIn = async () => {
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);

      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error("Failed to create session");
      }

      router.replace("/library");
    } catch (err) {
      console.error("Sign-in error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Sign-in failed");
      }
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-xl bg-white p-10 shadow-md text-center w-80">
        <h1 className="text-2xl font-bold mb-2">PDF Audiobook</h1>

        <p className="text-gray-500 mb-6 text-sm">
          Sign in to access your library
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleSignIn}
          className="w-full bg-blue-600 text-white rounded-lg py-2 px-4 hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>
      </div>
    </main>
  );
}