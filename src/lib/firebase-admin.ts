import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "pdf-audiobook-web-v2",
  });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };

export default admin;