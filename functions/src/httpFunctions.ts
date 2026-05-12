import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { FieldValue } from "firebase-admin/firestore";

/**
 * -------------------------------------------------------
 * Firebase Admin Initialization
 * -------------------------------------------------------
 * Prevent duplicate initialization during emulator reloads
 * -------------------------------------------------------
 */
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * -------------------------------------------------------
 * requestUpload
 * -------------------------------------------------------
 * Receives upload metadata from frontend.
 * Creates audiobook document in Firestore.
 * -------------------------------------------------------
 */
export const requestUpload = functions.https.onRequest(
  async (req, res) => {
    /**
     * ---------------------------------------------------
     * CORS
     * ---------------------------------------------------
     */
    res.set("Access-Control-Allow-Origin", "*");
    res.set(
      "Access-Control-Allow-Methods",
      "POST, OPTIONS"
    );

    res.set(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );

    /**
     * ---------------------------------------------------
     * Handle preflight
     * ---------------------------------------------------
     */
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      /**
       * -------------------------------------------------
       * Allow POST only
       * -------------------------------------------------
       */
      if (req.method !== "POST") {
        res.status(405).json({
          error: "Method Not Allowed",
        });

        return;
      }

      /**
       * -------------------------------------------------
       * Safe body parsing
       * -------------------------------------------------
       */
      const body =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body;

      const {
        fileName,
        fileUrl,
        userId,
        userEmail,
      } = body;

      /**
       * -------------------------------------------------
       * Validation
       * -------------------------------------------------
       */
      if (!fileName || !fileUrl || !userId) {
        res.status(400).json({
          error: "Missing required fields",
        });

        return;
      }

      /**
       * -------------------------------------------------
       * Firestore Write
       * -------------------------------------------------
       */
      const docRef = await db
        .collection("audiobooks")
        .add({
          fileName,
          fileUrl,
          userId,

          userEmail: userEmail || null,

          status: "pending_approval",

          createdAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp(),
        });

      console.log(
        "✅ Upload request created:",
        docRef.id
      );

      /**
       * -------------------------------------------------
       * Success response
       * -------------------------------------------------
       */
      res.status(200).json({
        success: true,
        bookId: docRef.id,
      });
    } catch (err: any) {
      console.error(
        "❌ requestUpload ERROR:",
        err
      );

      res.status(500).json({
        error:
          err?.message ||
          "Internal Server Error",
      });
    }
  }
);