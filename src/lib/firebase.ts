import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARmMXvMr-0ga_94HvxGFyuvYMYaEb2ieA",
  authDomain: "love-website-386bb.firebaseapp.com",
  projectId: "love-website-386bb",
  storageBucket: "love-website-386bb.firebasestorage.app",
  messagingSenderId: "956055242819",
  appId: "1:956055242819:web:6ac0f65daee1e58ad9acf6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const auth = getAuth(app);

// Cloudinary
const CLOUD_NAME = "dxsjvb6ou";
const UPLOAD_PRESET = "romantic-upload";

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("Cloudinary error:", data);
    throw new Error(data.error?.message || "Upload failed");
  }

  return data.secure_url;
}

// Gallery
export async function saveImageToFirestore(section: string, imageUrl: string) {
  return addDoc(collection(db, "gallery"), {
    section,
    imageUrl,
    createdAt: serverTimestamp(),
  });
}

// ✅ Real-time listener (NEW)
export function subscribeToGallery(
  section: string,
  callback: (data: Array<{ id: string; section: string; imageUrl: string }>) => void
) {
  const q = query(
    collection(db, "gallery"),
    where("section", "==", section),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    callback(data);
  });
}

// Fallback fetch (still useful)
export async function fetchGalleryImages(section?: string) {
  const q = section
    ? query(collection(db, "gallery"), where("section", "==", section), orderBy("createdAt", "desc"))
    : query(collection(db, "gallery"), orderBy("createdAt", "desc"));

  const snap = await (await import("firebase/firestore")).getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
    id: string;
    section: string;
    imageUrl: string;
    createdAt: Timestamp;
  }>;
}

export async function deleteGalleryImage(id: string) {
  return deleteDoc(doc(db, "gallery", id));
}

// Notes
export async function addNote(text: string) {
  return addDoc(collection(db, "notes"), {
    text,
    createdAt: serverTimestamp(),
  });
}

export async function fetchNotes() {
  const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
  const snap = await (await import("firebase/firestore")).getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
    id: string;
    text: string;
    createdAt: Timestamp;
  }>;
}

export async function deleteNote(id: string) {
  return deleteDoc(doc(db, "notes", id));
}

// Timeline
export async function addTimelineEvent(
  title: string,
  description: string,
  date: string
) {
  return addDoc(collection(db, "timeline"), {
    title,
    description,
    date,
    createdAt: serverTimestamp(),
  });
}

export async function fetchTimeline() {
  const q = query(collection(db, "timeline"), orderBy("date", "asc"));
  const snap = await (await import("firebase/firestore")).getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    createdAt: Timestamp;
  }>;
}

export async function deleteTimelineEvent(id: string) {
  return deleteDoc(doc(db, "timeline", id));
}