// ── Auth Functions ─────────────────────────────────────────────────────────────
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const registerWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

// TODO: LINE Login
// export const loginWithLINE = async () => { ... };
