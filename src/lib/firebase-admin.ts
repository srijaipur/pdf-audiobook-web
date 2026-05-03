import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountEnv) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON env variable");
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(serviceAccountEnv);
  } catch (err) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON JSON format");
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount),
  });

  return adminApp;
}

export const adminAuth = getAuth(getAdminApp());
export const adminDb = getFirestore(getAdminApp());