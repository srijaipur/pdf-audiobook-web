"use client";

 

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {

  signInWithRedirect,

  getRedirectResult,

  onAuthStateChanged,

} from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";

 

export default function LoginPage() {

  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

 

  useEffect(() => {

    // Handle redirect result when returning from Google

    getRedirectResult(auth)

      .then(async (result) => {

        if (result?.user) {

          const idToken = await result.user.getIdToken();

          await fetch("/api/auth/session", {

            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({ idToken }),

          });

        }

      })

      .catch((err) => {

        console.error("Redirect result error:", err);

        setError("Sign-in failed. Please try again.");

      });

 

    // Listen for auth state

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (user) {

        router.replace("/library");

      } else {

        setLoading(false);

      }

    });

 

    return () => unsubscribe();

  }, [router]);

 

  const handleSignIn = () => {

    setError("");

    signInWithRedirect(auth, googleProvider);

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

        <p className="text-gray-500 mb-6 text-sm">Sign in to access your library</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

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