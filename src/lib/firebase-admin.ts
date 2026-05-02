import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import {getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string 
    );
    adminApp = initializeApp({
        credential: cert(serviceAccount),
    });
    return adminApp;
}

export const adminAuth = getAuth(getAdminApp());
export const adminDb = getFirestore(getAdminApp());
