import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAYlifIi8EY3s8TSiI5mxnLKLeSfhc7Vb4",
  authDomain: "torneof1.firebaseapp.com",
  projectId: "torneof1",
  storageBucket: "torneof1.firebasestorage.app",
  messagingSenderId: "64983276789",
  appId: "1:64983276789:web:8c754396956a9933d039bc",
  measurementId: "G-2CR21TP8BJ",
};

// Inicializamos la app de Firebase
const app = initializeApp(firebaseConfig);

// Inicializamos la base de datos (Firestore) y la exportamos para poder usarla en el resto de la app
export const db = getFirestore(app);
