import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const getUserProfile = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};
