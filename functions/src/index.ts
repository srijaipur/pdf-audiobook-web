// functions/src/index.ts

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import fetch from "node-fetch";
import { FieldValue } from "firebase-admin/firestore";

// pdf-parse CommonJS import
const pdfParse = require("pdf-parse");

admin.initializeApp();

const db = admin.firestore();

/**
 * Upload PDF metadata
 * Initial state = pending_approval
 */
export const requestUpload = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    try {
      const { fileUrl, fileName, userId } = req.body;

      if (!fileUrl || !fileName || !userId) {
        res.status(400).json({
          error: "Missing parameters",
        });
        return;
      }

      const docRef = await db.collection("audiobooks").add({
        fileName,
        fileUrl,
        userId,
        status: "pending_approval",
        createdAt: FieldValue.serverTimestamp(),
      });

      console.log("✅ Upload request created:", docRef.id);

      res.json({
        success: true,
        id: docRef.id,
      });
    } catch (err: any) {
      console.error("Upload failed:", err);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

/**
 * Trigger audio generation when status becomes queued
 */
export const generateAudio = functions.firestore
  .document("audiobooks/{id}")
  .onUpdate(
    async (
      change: functions.Change<admin.firestore.DocumentSnapshot>,
      context: functions.EventContext
    ) => {
      const beforeData = change.before.data();
      const afterData = change.after.data();

      const docId = context.params.id;

      if (!docId || !afterData) {
        console.log("❌ Missing document data");
        return;
      }

      /**
       * Only trigger when status transitions TO queued
       */
      if (
        beforeData?.status === "queued" ||
        afterData.status !== "queued"
      ) {
        return;
      }

      console.log("🚀 Starting audio generation for", docId);

      /**
       * Move to processing
       */
      await db.collection("audiobooks").doc(docId).update({
        status: "processing",
      });

      try {
        /**
         * Download PDF
         */
        const response = await fetch(afterData.fileUrl);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch PDF: ${response.statusText}`
          );
        }

        const buffer = Buffer.from(
          await response.arrayBuffer()
        );

        /**
         * Extract text from PDF
         */
        const pdfData = await pdfParse(buffer);

        const text = pdfData.text || "";

        console.log("📄 Text length:", text.length);

        /**
         * Save result
         */
        await db.collection("audiobooks").doc(docId).update({
          status: "done",
          extractedTextLength: text.length,
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log("✅ Audio generation completed");
      } catch (err: any) {
        console.error("Audio generation failed:", err);

        await db.collection("audiobooks").doc(docId).update({
          status: "failed",
          error: err.message,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
  );