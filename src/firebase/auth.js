import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './config';

/**
 * Вход для гостей через Google
 */
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Ошибка входа через Firebase Auth:', error);
    throw error;
  }
};

/**
 * Выход из аккаунта Firebase
 */
export const logoutFirebase = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Ошибка выхода из Firebase Auth:', error);
    throw error;
  }
};

