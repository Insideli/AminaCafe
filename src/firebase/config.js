import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCayZ8gSclC24Y9ORgJuUOM6y-PXgp9wDE",
  authDomain: "amina-c7864.firebaseapp.com",
  projectId: "amina-c7864",
  storageBucket: "amina-c7864.firebasestorage.app",
  messagingSenderId: "216648759773",
  appId: "1:216648759773:web:93584a988e605f86a91e34",
  measurementId: "G-5X5RGCRY2H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;

