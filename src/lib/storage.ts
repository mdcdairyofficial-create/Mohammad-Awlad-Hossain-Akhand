import { storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export const uploadFile = async (bucket: string, path: string, file: File) => {
  const fullPath = bucket ? `${bucket}/${path}` : path;
  try {
    const fileRef = ref(storage, fullPath);
    const snapshot = await uploadBytes(fileRef, file);
    return snapshot;
  } catch (err) {
    console.warn("Client-side storage upload failed, falling back to server-side upload proxy:", err);
    
    try {
      const base64Data = await fileToBase64(file);
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64Data,
          path: fullPath,
          contentType: file.type
        })
      });
      
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Server upload proxy failed");
      }
      
      const result = await res.json();
      return {
        ref: {
          fullPath,
          name: file.name
        },
        serverUrl: result.url,
        metadata: {
          fullPath,
          name: file.name,
          downloadUrl: result.url
        }
      };
    } catch (fallbackErr: any) {
      console.error("Server fallback upload also failed:", fallbackErr);
      throw err;
    }
  }
};

export const getPublicUrl = async (bucket: string, path: string) => {
  const fullPath = bucket ? `${bucket}/${path}` : path;
  try {
    const fileRef = ref(storage, fullPath);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (err) {
    console.warn("Client-side getPublicUrl failed, deriving public URL format or local fallback URL:", err);
    const sanitizedFileName = fullPath.replace(/[\/\\?#%*:|"<>\s]/g, "_");
    return `${window.location.origin}/uploads/${sanitizedFileName}`;
  }
};

export const deleteFile = async (bucket: string, path: string) => {
  const fullPath = bucket ? `${bucket}/${path}` : path;
  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);
};

export const listFiles = async (bucket: string, path: string = '') => {
  const fullPath = bucket ? `${bucket}/${path}` : path;
  const folderRef = ref(storage, fullPath);
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
