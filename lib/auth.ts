import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  User,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db, googleProvider } from "./firebase";

export type ProfileMode =
  | "solo"
  | "couple"
  | "group";

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

const FIREBASE_TIMEOUT = 10000;

function withTimeout<T>(
  promise: Promise<T>,
  message: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let finished = false;

    const timeoutId = window.setTimeout(() => {
      if (finished) return;

      finished = true;
      reject(new Error(message));
    }, FIREBASE_TIMEOUT);

    promise.then(
      (value) => {
        if (finished) return;

        finished = true;
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        if (finished) return;

        finished = true;
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

export function randomAvatar(): string {
  return AVATARS[
    Math.floor(
      Math.random() * AVATARS.length
    )
  ];
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

  return names[
    Math.floor(
      Math.random() * names.length
    )
  ];
}

export function slugifyUsername(
  value: string
): string {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(
      /[^a-z0-9_]/g,
      ""
    )
    .slice(0, 30);
}

export async function ensureAnonymousUser(): Promise<User> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const result = await withTimeout(
    signInAnonymously(auth),
    "Não foi possível conectar ao Firebase."
  );

  return result.user;
}

export async function signInWithGoogle(): Promise<User> {
  const result = await withTimeout(
    signInWithPopup(auth, googleProvider),
    "O login com Google demorou demais."
  );

  return result.user;
}
export function subscribeToAuth(
  callback: (
    user: User | null
  ) => void
): () => void {
  return onAuthStateChanged(
    auth,
    callback
  );
}

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const ref = doc(
    db,
    "users",
    uid
  );

  const snapshot = await withTimeout(
    getDoc(ref),
    "O Firebase demorou demais para carregar seu perfil."
  );

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

/*
 * Busca um perfil público pelo endereço:
 *
 * /perfil/felipe
 *
 * O UID não precisa estar na URL.
 */
export async function getPublicProfileBySlug(
  usernameSlug: string
): Promise<
  (UserProfile & { uid: string }) | null
> {
  const normalizedSlug =
    slugifyUsername(
      usernameSlug
    );

  if (!normalizedSlug) {
    return null;
  }

  const usersRef =
    collection(
      db,
      "users"
    );

  const profileQuery =
    query(
      usersRef,
      where(
        "usernameSlug",
        "==",
        normalizedSlug
      ),
      limit(1)
    );

  const snapshot =
    await withTimeout(
      getDocs(profileQuery),
      "O Firebase demorou demais para localizar este perfil."
    );

  if (snapshot.empty) {
    return null;
  }

  const profileDoc =
    snapshot.docs[0];

  return {
    uid: profileDoc.id,
    ...(profileDoc.data() as UserProfile),
  };
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
  const ref = doc(
    db,
    "users",
    user.uid
  );

  const existing =
    await withTimeout(
      getDoc(ref),
      "O Firebase demorou demais para acessar seu perfil."
    );

  await withTimeout(
    setDoc(
      ref,
      {
        username:
          profile.username,

        usernameSlug:
          profile.usernameSlug,

        avatar:
          profile.avatar,

        mode:
          profile.mode,

        spaceName:
          profile.spaceName,

        updatedAt:
          serverTimestamp(),

        ...(existing.exists()
          ? {}
          : {
              createdAt:
                serverTimestamp(),
            }),
      },
      {
        merge: true,
      }
    ),
    "O Firebase demorou demais para salvar seu perfil."
  );
}
