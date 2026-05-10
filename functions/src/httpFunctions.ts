import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const requestUpload = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { fileName, fileUrl, userId } = req.body;
    if (!fileName || !fileUrl || !userId) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }

    const docRef = await db.collection("audiobooks").add({
      fileName,
      fileUrl,
      userId,
      status: "pending_approval",
      createdAt: new Date(),
    });

    res.json({ success: true, requestId: docRef.id });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});