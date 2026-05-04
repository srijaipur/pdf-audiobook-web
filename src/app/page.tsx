"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { createUserIfNotExists } from "@/lib/user";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      await createUserIfNotExists(user);
      router.replace("/library");
    } else {
      setLoading(false);
    }
  });

  return () => unsubscribe();
}, []);

  const handleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <main>
      <h1>Login</h1>
      <button onClick={handleSignIn}>
        Sign in with Google
      </button>
    </main>
  );
}