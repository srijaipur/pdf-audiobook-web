import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ FIX for Next.js params issue
    const { id: requestId } = await params;

    const body = await req.json();
    const { action } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request ID" },
        { status: 400 }
      );
    }

    const requestRef = adminDb.collection("requests").doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    const requestData = requestSnap.data();

    if (action === "approve") {
      // ✅ Create audiobook entry
      await adminDb.collection("audiobooks").add({
        fileName: requestData?.fileName,
        fileUrl: requestData?.fileUrl,
        userId: requestData?.userId,
        status: "processing", // later we'll generate audio
        createdAt: new Date(),
      });

      // ✅ Remove request
      await requestRef.delete();

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      await requestRef.delete();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("❌ ADMIN REQUEST ERROR:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}