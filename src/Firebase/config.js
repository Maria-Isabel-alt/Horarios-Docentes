import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBVR-fvrl9vIP-C6J4VefucUWZaNk8ZlWU",
  authDomain: "horarios-docentes-69123.firebaseapp.com",
  projectId: "horarios-docentes-69123",
  storageBucket: "horarios-docentes-69123.firebasestorage.app",
  messagingSenderId: "733646133669",
  appId: "1:733646133669:web:39df9e6e913bff6c07304c",
  measurementId: "G-KHFRXXD0ZQ",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;