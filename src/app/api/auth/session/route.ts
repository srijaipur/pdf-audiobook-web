import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    const decoded = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name } = decoded;

    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      await userRef.set({
        uid,
        email,
        displayName: name ?? "",
        isAdmin: false,
        createdAt: new Date().toISOString(),
      });
    }

    const response = NextResponse.json({ success: true });

    // 🔥 SET COOKIE (THIS FIXES YOUR LOOP)
    response.cookies.set("firebase-token", idToken, {
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}