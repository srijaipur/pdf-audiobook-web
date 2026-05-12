import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { FieldValue } from "firebase-admin/firestore";

const pdfParse = require("pdf-parse");

import { chunkText } from "./utils/chunkText";

const db = admin.firestore();

/**
 * =======================================================
 * Lazy-load OpenAI
 * =======================================================
 */
async function getOpenAIClient() {
  const OpenAIModule = await import("openai");

  const OpenAI =
    OpenAIModule.default || OpenAIModule;

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * =======================================================
 * OpenAI connection test helper
 * =======================================================
 */
export async function testOpenAIConnection() {
  try {
    const openai = await getOpenAIClient();

    const models = await openai.models.list();

    console.log("✅ OpenAI connected");

    console.log(models.data[0]);

    return true;
  } catch (err) {
    console.error(
      "❌ OpenAI connection failed:",
      err
    );

    return false;
  }
}

/**
 * =======================================================
 * generateAudio
 * =======================================================
 *
 * Pipeline:
 *
 * queued
 *   ↓
 * download PDF
 *   ↓
 * extract text
 *   ↓
 * create chunks
 *   ↓
 * queue TTS jobs
 * =======================================================
 */
export const generateAudio = functions.firestore
  .document("audiobooks/{id}")
  .onUpdate(
    async (
      change: functions.Change<
        admin.firestore.DocumentSnapshot
      >,
      context: functions.EventContext
    ) => {

      const beforeData = change.before.data();

      const afterData = change.after.data();

      const docId = context.params.id;

      /**
       * -------------------------------------------------
       * Validation
       * -------------------------------------------------
       */
      if (!docId || !afterData) {
        console.log(
          "❌ Missing document data"
        );

        return;
      }

      /**
       * -------------------------------------------------
       * Only trigger on transition TO queued
       * -------------------------------------------------
       */
      if (
        beforeData?.status === "queued" ||
        afterData.status !== "queued"
      ) {
        return;
      }

      console.log(
        "🚀 Starting audio generation for",
        docId
      );

      const audiobookRef = db
        .collection("audiobooks")
        .doc(docId);

      /**
       * -------------------------------------------------
       * Mark processing
       * -------------------------------------------------
       */
      await audiobookRef.update({
        status: "processing",
        updatedAt:
          FieldValue.serverTimestamp(),
      });

      try {

        /**
         * ---------------------------------------------
         * Download PDF
         * ---------------------------------------------
         */
        const response = await fetch(
          afterData.fileUrl
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch PDF: ${response.statusText}`
          );
        }

        const buffer = Buffer.from(
          await response.arrayBuffer()
        );

        /**
         * ---------------------------------------------
         * Extract text
         * ---------------------------------------------
         */
        const pdfData = await pdfParse(buffer);

        const text = pdfData.text || "";

        console.log(
          "📄 Extracted text length:",
          text.length
        );

        /**
         * ---------------------------------------------
         * Chunk text
         * ---------------------------------------------
         */
        const chunks = chunkText(text);

        console.log(
          `✂️ Created ${chunks.length} chunks`
        );

        /**
         * ---------------------------------------------
         * Create chunk documents
         * ---------------------------------------------
         */
        const batch = db.batch();

        chunks.forEach((chunk) => {

          const chunkRef = audiobookRef
            .collection("chunks")
            .doc();

          batch.set(chunkRef, {
            order: chunk.order,

            text: chunk.text,

            status: "pending_tts",

            createdAt:
              FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp(),
          });
        });

        await batch.commit();

        /**
         * ---------------------------------------------
         * Update audiobook status
         * ---------------------------------------------
         */
        await audiobookRef.update({

          status: "generating_audio",

          extractedTextLength:
            text.length,

          totalChunks:
            chunks.length,

          updatedAt:
            FieldValue.serverTimestamp(),
        });

        console.log(
          "✅ Chunk generation complete"
        );

      } catch (err: any) {

        console.error(
          "❌ Audio generation failed:",
          err
        );

        await audiobookRef.update({

          status: "failed",

          error: err.message,

          updatedAt:
            FieldValue.serverTimestamp(),
        });
      }
    }
  );