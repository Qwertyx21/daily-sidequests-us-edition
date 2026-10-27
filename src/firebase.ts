import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC1tR-idMqLiC8xxwCgnxF1YqWOn4H7C4A",
  authDomain: "couplequests-4faa5.firebaseapp.com",
  projectId: "couplequests-4faa5",
  storageBucket: "couplequests-4faa5.firebasestorage.app",
  messagingSenderId: "633537838047",
  appId: "1:633537838047:web:e3f6d7ab7183e84323c57c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut };
