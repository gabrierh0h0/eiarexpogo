// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBj9wAPQbd_LXNOigSEMUWaI7knWJzaEUE",
  authDomain: "eiar-7161f.firebaseapp.com",
  databaseURL: "https://eiar-7161f-default-rtdb.firebaseio.com",
  projectId: "eiar-7161f",
  storageBucket: "eiar-7161f.firebasestorage.app",
  messagingSenderId: "1097917534201",
  appId: "1:1097917534201:web:e78dfb7d5eb7253aa07728",
  measurementId: "G-LJW7EWXL3R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Exportamos auth para usar en Login y Register
export const auth = getAuth(app);
export const db = getFirestore(app); 

