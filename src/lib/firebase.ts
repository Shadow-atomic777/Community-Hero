import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyBCsUeKs3qIvq1prI-iD4t-Mzrn5NelpsU",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "community-hero-62a0c.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "community-hero-62a0c",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "community-hero-62a0c.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "754002378739",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:754002378739:web:a98aa57ba3adc1b3de9c86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
