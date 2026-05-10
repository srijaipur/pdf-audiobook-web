import { NextResponse } from "next/server";

import admin from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await admin
      .firestore()
      .collection("requests")
      .orderBy("createdAt", "desc")
      .get();

    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(requests);
  } catch (err) {
    console.error("❌ Failed to fetch requests:", err);

    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}