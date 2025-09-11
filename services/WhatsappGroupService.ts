import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
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

// Batch fetch groups by IDs using Firestore 'in' queries (chunked by 10)
export const getWhatsappGroupsByIds = async (ids: string[]): Promise<WhatsappGroup[]> => {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 10) chunks.push(unique.slice(i, i + 10));

  const results: WhatsappGroup[] = [];
  for (const chunk of chunks) {
    const q = query(collection(db, COLLECTION_NAME), where('__name__', 'in', chunk));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as WhatsappGroup);
    });
  }
  return results;
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
