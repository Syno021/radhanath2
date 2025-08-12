import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseCo';
import { WhatsappGroup } from '../models/whatsappGroup.model';

const COLLECTION_NAME = 'whatsapp-groups';

export const getWhatsappGroups = async (): Promise<WhatsappGroup[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as WhatsappGroup[];
};

export const getWhatsappGroupById = async (id: string): Promise<WhatsappGroup | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as WhatsappGroup;
  }
  return null;
};

export const addWhatsappGroup = async (group: Omit<WhatsappGroup, 'id'>): Promise<string> => {
  // 1. Add the group to "whatsapp-groups" collection
  const docRef = await addDoc(collection(db, COLLECTION_NAME), group);

  // 2. Update the matching region's whatsappGroups array
  if (group.regionId) {
    const regionRef = doc(db, 'regions', group.regionId);
    await updateDoc(regionRef, {
      whatsappGroups: arrayUnion(docRef.id),
    });
  }

  return docRef.id;
};

export const updateWhatsappGroup = async (id: string, data: Partial<WhatsappGroup>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, data);
};

export const deleteWhatsappGroup = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
