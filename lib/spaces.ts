import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

export type SpaceMode = "couple" | "group";

export type SpaceStatus =
  | "waiting"
  | "active"
  | "locked";

export type SpaceMember = {
  uid: string;
  username: string;
  avatar: string;
  role: "host" | "member";
  joinedAt?: unknown;
};

export type SpaceJoinRequest = {
  uid: string;
  username: string;
  avatar: string;
  createdAt?: unknown;
};

export type Space = {
  id: string;
  code: string;
  name: string;
  mode: SpaceMode;
  status: SpaceStatus;
  hostUid: string;
  maxParticipants: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SpaceTitle = {
  id: string;
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  year: string;
  tmdbRating: number;
  tmdbVoteCount: number;
  addedBy: string;
  addedAt?: unknown;
};

export type SpaceRating = {
  uid: string;
  rating: number;
  review: string;
  updatedAt?: unknown;
};

const FIREBASE_TIMEOUT = 10000;

function withTimeout<T>(
  promise: Promise<T>,
  message: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(message));
      }, FIREBASE_TIMEOUT);
    }),
  ]);
}

function generateCode(length = 6): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < length; i += 1) {
    code +=
      chars[
        Math.floor(
          Math.random() * chars.length
        )
      ];
  }

  return code;
}

async function codeAlreadyExists(
  code: string
): Promise<boolean> {
  const q = query(
    collection(db, "spaces"),
    where("code", "==", code)
  );

  const snapshot = await withTimeout(
    getDocs(q),
    "O Firebase demorou demais para verificar o código da sala."
  );

  return snapshot.docs.some(
    (item) =>
      item.data().status === "waiting"
  );
}

async function generateUniqueCode(): Promise<string> {
  for (
    let attempt = 0;
    attempt < 10;
    attempt += 1
  ) {
    const code = generateCode();

    if (
      !(await codeAlreadyExists(code))
    ) {
      return code;
    }
  }

  throw new Error(
    "Não foi possível gerar um código de sala."
  );
}

export async function createSpace(params: {
  hostUid: string;
  hostUsername: string;
  hostAvatar: string;
  name: string;
  mode: SpaceMode;
}): Promise<Space> {
  const code =
    await generateUniqueCode();

  const spaceRef = doc(
    collection(db, "spaces")
  );

  const maxParticipants =
    params.mode === "couple"
      ? 2
      : 10;

  const space: Space = {
    id: spaceRef.id,
    code,
    name: params.name,
    mode: params.mode,
    status: "waiting",
    hostUid: params.hostUid,
    maxParticipants,
  };

  await withTimeout(
    setDoc(spaceRef, {
      ...space,
      createdAt:
        serverTimestamp(),
      updatedAt:
        serverTimestamp(),
    }),
    "Não foi possível criar a sala."
  );

  const memberRef = doc(
    db,
    "spaces",
    space.id,
    "members",
    params.hostUid
  );

  await withTimeout(
    setDoc(memberRef, {
      uid:
        params.hostUid,
      username:
        params.hostUsername,
      avatar
