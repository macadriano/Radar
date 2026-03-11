import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, enableNetwork } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const hasValidConfig = typeof firebaseConfig.apiKey === "string" && firebaseConfig.apiKey.length > 0;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (hasValidConfig) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    enableNetwork(db).catch(() => {});
}

export { app, auth, db, storage };

export function requireAuth(): Auth {
    if (!auth) throw new Error("Firebase Auth no configurado.");
    return auth;
}

export function requireDb(): Firestore {
    if (!db) throw new Error("Firebase Firestore no configurado.");
    return db;
}

export function requireStorage(): FirebaseStorage {
    if (!storage) throw new Error("Firebase Storage no configurado.");
    return storage;
}

export const firebaseConfigured = hasValidConfig;
