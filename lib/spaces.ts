import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

export type SpaceMode = "couple" | "group";

export type SpaceStatus = "waiting" | "active" | "locked";

export type SpaceMember = {
  uid: string;
  username: string;
  avatar: string;
  role: "host" | "member";
  joinedAt?: unknown;
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

function generateCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}


async function codeAlreadyExists(code: string): Promise<boolean> {
  const q = query(
    collection(db, "spaces"),
    where("code", "==", code)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.some(
    (item) => item.data().status === "waiting"
  );
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateCode();

    if (!(await codeAlreadyExists(code))) {
      return code;
    }
  }

  throw new Error("Não foi possível gerar um código de sala.");
}

export async function createSpace(params: {
  hostUid: string;
  hostUsername: string;
  hostAvatar: string;
  name: string;
  mode: SpaceMode;
}): Promise<Space> {
  const code = await generateUniqueCode();

  const spaceRef = doc(collection(db, "spaces"));

  const maxParticipants = params.mode === "couple" ? 2 : 10;

  const space: Space = {
    id: spaceRef.id,
    code,
    name: params.name,
    mode: params.mode,
    status: "waiting",
    hostUid: params.hostUid,
    maxParticipants,
  };

  await setDoc(spaceRef, {
    ...space,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const memberRef = doc(
    db,
    "spaces",
    space.id,
    "members",
    params.hostUid
  );

  await setDoc(memberRef, {
    uid: params.hostUid,
    username: params.hostUsername,
    avatar: params.hostAvatar,
    role: "host",
    joinedAt: serverTimestamp(),
  });

  return space;
}


export async function findWaitingSpaceByCode(
  code: string
): Promise<Space | null> {
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  const q = query(
    collection(db, "spaces"),
    where("code", "==", normalized)
  );

  const snapshot = await getDocs(q);

  const spaceDoc = snapshot.docs.find(
    (item) => item.data().status === "waiting"
  );

  if (!spaceDoc) {
    return null;
  }

  const data = spaceDoc.data();

  return {
    id: spaceDoc.id,
    ...(data as Omit<Space, "id">),
  };
}

export async function joinSpace(params: {
  space: Space;
  uid: string;
  username: string;
  avatar: string;
}): Promise<void> {
  const memberRef = doc(
    db,
    "spaces",
    params.space.id,
    "members",
    params.uid
  );

  await setDoc(
    memberRef,
    {
      uid: params.uid,
      username: params.username,
      avatar: params.avatar,
      role: params.uid === params.space.hostUid ? "host" : "member",
      joinedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeToSpace(
  spaceId: string,
  callback: (space: Space | null) => void
): () => void {
  const ref = doc(db, "spaces", spaceId);

  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback({
        id: snapshot.id,
        ...(snapshot.data() as Omit<Space, "id">),
      });
    },
    () => {
      callback(null);
    }
  );
}

export function subscribeToMembers(
  spaceId: string,
  callback: (members: SpaceMember[]) => void
): () => void {
  const membersRef = collection(
    db,
    "spaces",
    spaceId,
    "members"
  );

  return onSnapshot(
    membersRef,
    (snapshot) => {
      const members = snapshot.docs.map((item) => {
        return item.data() as SpaceMember;
      });

      members.sort((a, b) => {
        if (a.role === "host") return -1;
        if (b.role === "host") return 1;

        return a.username.localeCompare(b.username);
      });

      callback(members);
    },
    () => {
      callback([]);
    }
  );
}

export async function startSpace(spaceId: string): Promise<void> {
  const ref = doc(db, "spaces", spaceId);

  await setDoc(
    ref,
    {
      status: "active",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function lockSpace(spaceId: string): Promise<void> {
  const ref = doc(db, "spaces", spaceId);

  await setDoc(
    ref,
    {
      status: "locked",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
