import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore'; // Volvemos a usar initializeFirestore

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// 🕵️ CHIVATO: Esto imprimirá el ID en la consola. 
// Si en tu navegador sale "undefined", el problema son las variables de Vercel.
console.log("🔥 Proyecto Firebase conectado:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);

// 🛡️ MAGIA ANTI-OFFLINE: Obligamos a Firebase a usar "Long Polling"
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});