import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

import OpenAI from "openai";

import fs from "fs";
import path from "path";

import { db } from "./lib/firebase";
import { uploadToR2 } from "./lib/r2";

/**
 * -----------------------------
 * Lazy OpenAI client
 * -----------------------------
 */
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * -----------------------------
 * TTS worker
 * -----------------------------
 */
export const processTTSChunk = functions.firestore
  .document(
    "audiobooks/{bookId}/chunks/{chunkId}"
  )
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    const { bookId, chunkId } =
      context.params;

    if (!after) return;

    /**
     * Only process pending chunks
     */
    if (
      after.status !== "pending_tts" ||
      before?.status === "pending_tts"
    ) {
      return;
    }

    console.log(
      "🎧 Generating audio:",
      bookId,
      chunkId
    );

    const chunkRef = db
      .collection("audiobooks")
      .doc(bookId)
      .collection("chunks")
      .doc(chunkId);

    try {
      /**
       * Mark generating
       */
      await chunkRef.update({
        status: "generating_audio",
        updatedAt:
          FieldValue.serverTimestamp(),
      });

      /**
       * Generate speech with OpenAI
       */
      const openai = getOpenAIClient();

const mp3Response =
  await openai.audio.speech.create({
          model: "gpt-4o-mini-tts",
          voice: "alloy",
          input: after.text,
        });

      const arrayBuffer =
        await mp3Response.arrayBuffer();

      const buffer = Buffer.from(
        arrayBuffer
      );

      /**
       * Upload REAL audio
       */
      const audioUrl = await uploadToR2(
        `audiobooks/${bookId}/${chunkId}.mp3`,
        buffer,
        "audio/mpeg"
      );

      /**
       * Mark complete
       */
      await chunkRef.update({
        status: "completed",
        audioUrl,
        isFallbackAudio: false,
        ttsProvider: "openai",
        updatedAt:
          FieldValue.serverTimestamp(),
      });

      console.log(
        "✅ Chunk audio complete:",
        chunkId
      );
    } catch (err: any) {
      console.error(
        "❌ OpenAI TTS failed:",
        err
      );

      /**
       * ---------------------------------
       * FALLBACK MODE
       * ---------------------------------
       */
      try {
        console.log(
          "⚠️ Using fallback silent audio"
        );

        const fallbackPath = path.join(
          __dirname,
          "../assets/silent.mp3"
        );

        const fallbackBuffer =
          fs.readFileSync(fallbackPath);

        const fallbackUrl =
          await uploadToR2(
            `audiobooks/${bookId}/${chunkId}-fallback.mp3`,
            fallbackBuffer,
            "audio/mpeg"
          );

        await chunkRef.update({
          status: "completed",
          audioUrl: fallbackUrl,
          isFallbackAudio: true,
          ttsProvider: "fallback",
          fallbackReason:
            err?.message || "unknown",
          updatedAt:
            FieldValue.serverTimestamp(),
        });

        console.log(
          "✅ Fallback audio uploaded:",
          chunkId
        );
      } catch (fallbackErr: any) {
        console.error(
          "❌ Fallback failed:",
          fallbackErr
        );

        await chunkRef.update({
          status: "failed",
          error:
            fallbackErr?.message ||
            "unknown fallback error",
          updatedAt:
            FieldValue.serverTimestamp(),
        });
      }
    }
  });