// js/firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDnO_07BlVRTZap8wvyVXbfnAK4pFmdqM8",
  authDomain: "church-backend-16678.firebaseapp.com",
  projectId: "church-backend-16678",
  storageBucket: "church-backend-16678.firebasestorage.app",
  messagingSenderId: "825244477109",
  appId: "1:825244477109:web:07fe7a88af7e39eb9740fc",
  measurementId: "G-LP65HY0YYQ",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
