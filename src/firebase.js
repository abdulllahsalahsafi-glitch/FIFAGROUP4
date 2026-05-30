import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-Bbu8-GvdfxzWdZCKI70tXPftcYkkkJM",
  authDomain: "fifa-group.firebaseapp.com",
  projectId: "fifa-group",
  storageBucket: "fifa-group.firebasestorage.app",
  messagingSenderId: "1063835143344",
  appId: "1:1063835143344:web:6b37c2e4984f5800977f75"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
