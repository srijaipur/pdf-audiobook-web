import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

import fs from "fs";
import path from "path";
import os from "os";

import { db } from "./lib/firebase";

import { downloadFile } from "./lib/downloadFile";

import { assembleAudiobook } from "./lib/assembleAudiobook";

import { uploadToR2 } from "./lib/r2";

/**
 * ------------------------------------------------
 * Aggregates chunk completion into audiobook state
 * ------------------------------------------------
 */
export const aggregateAudiobookStatus =
  functions.firestore
    .document(
      "audiobooks/{bookId}/chunks/{chunkId}"
    )
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();

      const { bookId } = context.params;

      if (!after) return;

      /**
       * Only react when chunk becomes completed
       */
      if (
        before?.status === "completed" ||
        after.status !== "completed"
      ) {
        return;
      }

      console.log(
        "📚 Aggregating audiobook:",
        bookId
      );

      try {
        const chunksSnapshot = await db
          .collection("audiobooks")
          .doc(bookId)
          .collection("chunks")
          .get();

        const totalChunks =
          chunksSnapshot.docs.length;

        let completedChunks = 0;

        const chunkManifest: any[] = [];

        chunksSnapshot.docs.forEach((doc) => {
          const data = doc.data();

          if (data.status === "completed") {
            completedChunks++;
          }

          chunkManifest.push({
            chunkId: doc.id,
            order: data.order,
            audioUrl: data.audioUrl || null,
            status: data.status,
            isFallbackAudio:
              data.isFallbackAudio || false,
          });
        });

        /**
         * Sort playback order
         */
        chunkManifest.sort(
          (a, b) => a.order - b.order
        );

        const audiobookRef = db
          .collection("audiobooks")
          .doc(bookId);

        /**
         * If all chunks completed
         */
        if (
          completedChunks === totalChunks &&
          totalChunks > 0
        ) {
          console.log(
            "🎬 Starting final audiobook assembly"
          );

          const tempDir =
            fs.mkdtempSync(
              path.join(
                os.tmpdir(),
                "assembly-"
              )
            );

          const localChunkPaths: string[] =
            [];

          for (const chunk of chunkManifest) {
            if (!chunk.audioUrl) {
              continue;
            }

            const localPath = path.join(
              tempDir,
              `${chunk.chunkId}.mp3`
            );

            console.log(
              "⬇️ Downloading chunk:",
              chunk.audioUrl
            );

            await downloadFile(
              chunk.audioUrl,
              localPath
            );

            localChunkPaths.push(
              localPath
            );
          }

          console.log(
            "🎞️ Merging chunks:",
            localChunkPaths.length
          );

          const mergedOutputPath =
            await assembleAudiobook(
              localChunkPaths,
              `${bookId}.mp3`
            );

          console.log(
            "☁️ Uploading final audiobook"
          );

          const mergedBuffer =
            fs.readFileSync(
              mergedOutputPath
            );

          const finalAudioUrl =
            await uploadToR2(
              `audiobooks/${bookId}/final-audiobook.mp3`,
              mergedBuffer,
              "audio/mpeg"
            );

          console.log(
            "✅ Final audiobook uploaded:",
            finalAudioUrl
          );

          await audiobookRef.update({
            status: "ready",

            playbackMode:
              "chunk_stream",

            finalAudioUrl,

            totalChunks,

            completedChunks,

            chunkManifest,

            completedAt:
              FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp(),
          });

          console.log(
            "✅ Audiobook READY:",
            bookId
          );
        } else {
          /**
           * Partial progress update
           */
          await audiobookRef.update({
            status:
              "generating_audio",

            totalChunks,

            completedChunks,

            updatedAt:
              FieldValue.serverTimestamp(),
          });

          console.log(
            `🎧 Progress ${completedChunks}/${totalChunks}`
          );
        }
      } catch (err) {
        console.error(
          "❌ Aggregation failed:",
          err
        );
      }
    });