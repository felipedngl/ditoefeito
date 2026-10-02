"use client";

import {
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db, googleProvider } from "./firebase";

export type ProfileMode = "solo" | "couple" | "group";

export interface UserProfile {
  username: string;
  usernameSlug: string;
  avatar: string;
  mode: ProfileMode;
  spaceName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const AVATARS = [
  "🦊",
  "🐼",
  "🐸",
  "🐯",
  "🦁",
  "🐨",
  "🐵",
  "🐙",
  "🦄",
  "🐲",
  "🐱",
  "🐶",
  "🐻",
  "🐰",
  "🐹",
  "🐼",
  "🦉",
  "🐧",
  "🐳",
  "🦈",
  "🐝",
  "🦋",
  "🐞",
  "🐢",
  "🦖",
  "👽",
  "🤖",
  "👾",
  "🎃",
  "🌈",
];

export function randomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export function createUsername(): string {
  const names = [
    "CineNauta",
    "Sessão Neon",
    "Filmeiro",
    "Tela 80",
    "Cinéfilo 404",
    "Cinema Club",
    "Tela Mágica",
    "Filme & Pipoca",
    "Neon Viewer",
    "Cine Player",
    "Tela Retro",
    "Sessão Extra",
  ];

  return names[Math.floor(Math.random() * names.length)];
}

export function slugifyUsername(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

export async function ensureAnonymousUser(): Promise<User> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const result = await signInAnonymously(auth);

  return result.user;
}

export async function signInWithGoogle(): Promise<User> {
  const currentUser = auth.currentUser;

  /*
   * Se o usuário já estiver como convidado,
   * vinculamos o Google à conta existente.
   *
   * Isso é importante para não criar uma segunda conta
   * e perder os dados que ele já começou a criar.
   */
  if (currentUser?.isAnonymous) {
    const result = await linkWithPopup(currentUser, googleProvider);
    return result.user;
  }

  const result = await signInWithPopup(auth, googleProvider);

  return result.user;
}

export function subscribeToAuth(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function saveUserProfile(
  user: User,
  profile: {
    username: string;
    usernameSlug: string;
    avatar: string;
    mode: ProfileMode;
    spaceName: string;
  }
): Promise<void> {
  const ref = doc(db, "users", user.uid);

  const existing = await getDoc(ref);

  await setDoc(
    ref,
    {
      username: profile.username,
      usernameSlug: profile.usernameSlug,
      avatar: profile.avatar,
      mode: profile.mode,
      spaceName: profile.spaceName,

      updatedAt: serverTimestamp(),

      ...(existing.exists()
        ? {}
        : {
            createdAt: serverTimestamp(),
          }),
    },
    {
      merge: true,
    }
  );
}
