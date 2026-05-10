import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const docId = formData.get("docId") as string;

    if (!file || !docId) {
      return NextResponse.json(
        { error: "Missing file or docId" },
        { status: 400 }
      );
    }

    const fakePdfUrl = `pending://${docId}`;
    const requestId = uuidv4();

    await adminDb.collection("requests").doc(requestId).set({
      type: "pdfUpload",
      status: "pending",
      requestedBy: "TEMP_USER",
      payload: {
        docId,
        title: file.name,
      },
      createdAt: new Date(),
    });

    await adminDb.collection("audiobooks").doc(docId).set({
      title: file.name,
      pdfUrl: fakePdfUrl,
      status: "pending_approval",
      audioUrl: null,
      assignedToUsers: [],
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "Request submitted for approval",
      requestId,
    });

  } catch (err: any) {
    console.error("❌ REQUEST UPLOAD ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}