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

/*
 * Avatares disponíveis.
 *
 * Mantemos cada avatar apenas uma vez para
 * evitar opções visualmente duplicadas.
 */
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

/*
 * Sorteia um avatar.
 */
export function randomAvatar(): string {
  return AVATARS[
    Math.floor(Math.random() * AVATARS.length)
  ];
}

/*
 * Nomes iniciais neutros.
 *
 * Não usamos nomes de pessoas como exemplo.
 */
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

  return names[
    Math.floor(Math.random() * names.length)
  ];
}

/*
 * Cria o identificador usado depois do @.
 */
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

/*
 * Garante uma sessão anônima quando ainda
 * não existe usuário autenticado.
 */
export async function ensureAnonymousUser(): Promise<User> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const result = await signInAnonymously(auth);

  return result.user;
}

/*
 * Login com Google.
 *
 * Se já estivermos em uma conta anônima,
 * vinculamos o Google à mesma conta para
 * preservar os dados existentes.
 */
export async function signInWithGoogle(): Promise<User> {
  const currentUser = auth.currentUser;

  if (currentUser?.isAnonymous) {
    const result = await linkWithPopup(
      currentUser,
      googleProvider
    );

    return result.user;
  }

  const result = await signInWithPopup(
    auth,
    googleProvider
  );

  return result.user;
}

/*
 * Observa mudanças de autenticação.
 */
export function subscribeToAuth(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/*
 * Busca o perfil do usuário.
 */
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

/*
 * Salva ou atualiza o perfil.
 */
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
