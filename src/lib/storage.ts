import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

export const uploadFile = async (bucket: string, path: string, file: File) => {
  const fileRef = ref(storage, `${bucket}/${path}`);
  const snapshot = await uploadBytes(fileRef, file);
  return snapshot;
};

export const getPublicUrl = async (bucket: string, path: string) => {
  const fileRef = ref(storage, `${bucket}/${path}`);
  const url = await getDownloadURL(fileRef);
  return url;
};

export const deleteFile = async (bucket: string, path: string) => {
  const fileRef = ref(storage, `${bucket}/${path}`);
  await deleteObject(fileRef);
};

export const listFiles = async (bucket: string, path: string = '') => {
  const folderRef = ref(storage, `${bucket}/${path}`);
  const result = await listAll(folderRef);
  
  const folders = result.prefixes.map(folderRef => ({
    name: folderRef.name,
    id: null,
    path: folderRef.fullPath,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {}
  }));

  const files = result.items.map(itemRef => ({
    name: itemRef.name,
    id: itemRef.fullPath,
    path: itemRef.fullPath,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {}
  }));

  return [...folders, ...files];
};
