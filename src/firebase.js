import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7juQnuA5Z9RK2dI73RGeEwn7WdCqvLYc",
  authDomain: "precolado-6b6e2.firebaseapp.com",
  projectId: "precolado-6b6e2",
  storageBucket: "precolado-6b6e2.firebasestorage.app",
  messagingSenderId: "966369809698",
  appId: "1:966369809698:web:55f1e3539ba1dca721c17b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
