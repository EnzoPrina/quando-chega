import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCnfdev_4c7PqX_9D4KkO306ElVie41IQQ",
  authDomain: "quandochega-24f2c.firebaseapp.com",
  projectId: "quandochega-24f2c",
  storageBucket: "quandochega-24f2c.firebasestorage.app",
  messagingSenderId: "886722290849",
  appId: "1:886722290849:web:41c7609135d0350b5afce0",
};

// 🔥 EXPORTAR APP (CLAVE)
export const app = initializeApp(firebaseConfig);

// 🔥 SERVICES
export const auth = getAuth(app);
export const db = getFirestore(app);