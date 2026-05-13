import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { UserRole } from "@/types/roles";

export async function createUserIfNotExists(user: any) {
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const role: UserRole = "basicUser";

    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "Anonymous",

      role,

      useNeuralTTS: false,

      createdAt: serverTimestamp(),

      createdBy: "system",
    });
  }
}