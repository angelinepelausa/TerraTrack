import { auth } from '../firebase';

export async function login(email, password) {
  return auth().signInWithEmailAndPassword(email, password);
}
