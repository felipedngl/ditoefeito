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
      uid: params.hostUid,
      username:
        params.hostUsername,
      avatar:
        params.hostAvatar,
      role: "host",
      joinedAt:
        serverTimestamp(),
    }),
    "Não foi possível registrar o anfitrião."
  );

  return space;
}

export async function findWaitingSpaceByCode(
  code: string
): Promise<Space | null> {
  const normalized =
    code.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  const q = query(
    collection(db, "spaces"),
    where("code", "==", normalized)
  );

  const snapshot = await withTimeout(
    getDocs(q),
    "O Firebase demorou demais para localizar a sala."
  );

  const spaceDoc =
    snapshot.docs.find(
      (item) =>
        item.data().status ===
        "waiting"
    );

  if (!spaceDoc) {
    return null;
  }

  const data =
    spaceDoc.data();

  return {
    id: spaceDoc.id,
    ...(data as Omit<
      Space,
      "id"
    >),
  };
}

/* =========================================================
   ENTRADA NA SALA
   ========================================================= */

export async function requestToJoinSpace(
  params: {
    space: Space;
    uid: string;
    username: string;
    avatar: string;
  }
): Promise<"already-member" | "requested" | "full"> {
  const memberRef = doc(
    db,
    "spaces",
    params.space.id,
    "members",
    params.uid
  );

  const requestRef = doc(
    db,
    "spaces",
    params.space.id,
    "joinRequests",
    params.uid
  );

  const membersRef =
    collection(
      db,
      "spaces",
      params.space.id,
      "members"
    );

  const result =
    await withTimeout(
      runTransaction(
        db,
        async (transaction) => {
          const memberSnapshot =
            await transaction.get(
              memberRef
            );

          if (
            memberSnapshot.exists()
          ) {
            return "already-member" as const;
          }

          const membersSnapshot =
            await transaction.get(
              membersRef
            );

          const participantCount =
            membersSnapshot.size;

          if (
            participantCount >=
            params.space
              .maxParticipants
          ) {
            return "full" as const;
          }

          transaction.set(
            requestRef,
            {
              uid:
                params.uid,
              username:
                params.username,
              avatar:
                params.avatar,
              createdAt:
                serverTimestamp(),
            },
            {
              merge: true,
            }
          );

          return "requested" as const;
        }
      ),
      "Não foi possível solicitar entrada na sala."
    );

  return result;
}

export async function acceptJoinRequest(
  params: {
    space: Space;
    request: SpaceJoinRequest;
  }
): Promise<void> {
  const memberRef = doc(
    db,
    "spaces",
    params.space.id,
    "members",
    params.request.uid
  );

  const requestRef = doc(
    db,
    "spaces",
    params.space.id,
    "joinRequests",
    params.request.uid
  );

  const membersRef =
    collection(
      db,
      "spaces",
      params.space.id,
      "members"
    );

  await withTimeout(
    runTransaction(
      db,
      async (transaction) => {
        const memberSnapshot =
          await transaction.get(
            memberRef
          );

        if (
          memberSnapshot.exists()
        ) {
          transaction.delete(
            requestRef
          );

          return;
        }

        const membersSnapshot =
          await transaction.get(
            membersRef
          );

        if (
          membersSnapshot.size >=
          params.space
            .maxParticipants
        ) {
          throw new Error(
            "A sala já está cheia."
          );
        }

        transaction.set(
          memberRef,
          {
            uid:
              params.request.uid,
            username:
              params.request
                .username,
            avatar:
              params.request.avatar,
            role: "member",
            joinedAt:
              serverTimestamp(),
          }
        );

        transaction.delete(
          requestRef
        );
      }
    ),
    "Não foi possível aceitar este participante."
  );
}

export async function rejectJoinRequest(
  spaceId: string,
  uid: string
): Promise<void> {
  const requestRef = doc(
    db,
    "spaces",
    spaceId,
    "joinRequests",
    uid
  );

  await withTimeout(
    deleteDoc(requestRef),
    "Não foi possível recusar este participante."
  );
}

export function subscribeToJoinRequests(
  spaceId: string,
  callback: (
    requests: SpaceJoinRequest[]
  ) => void
): () => void {
  const requestsRef =
    collection(
      db,
      "spaces",
      spaceId,
      "joinRequests"
    );

  return onSnapshot(
    requestsRef,
    (snapshot) => {
      const requests =
        snapshot.docs.map(
          (item) =>
            item.data() as SpaceJoinRequest
        );

      callback(requests);
    },
    (error) => {
      console.error(
        "Erro ao observar pedidos de entrada:",
        error
      );

      callback([]);
    }
  );
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

  await withTimeout(
    setDoc(
      memberRef,
      {
        uid:
          params.uid,
        username:
          params.username,
        avatar:
          params.avatar,
        role:
          params.uid ===
          params.space.hostUid
            ? "host"
            : "member",
        joinedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    ),
    "Não foi possível entrar na sala."
  );
}

/* =========================================================
   SALA
   ========================================================= */

export function subscribeToSpace(
  spaceId: string,
  callback: (
    space: Space | null
  ) => void
): () => void {
  const ref = doc(
    db,
    "spaces",
    spaceId
  );

  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback({
        id: snapshot.id,
        ...(snapshot.data() as Omit<
          Space,
          "id"
        >),
      });
    },
    (error) => {
      console.error(
        "Erro ao observar sala:",
        error
      );

      callback(null);
    }
  );
}

export function subscribeToMembers(
  spaceId: string,
  callback: (
    members: SpaceMember[]
  ) => void
): () => void {
  const membersRef =
    collection(
      db,
      "spaces",
      spaceId,
      "members"
    );

  return onSnapshot(
    membersRef,
    (snapshot) => {
      const members =
        snapshot.docs.map(
          (item) =>
            item.data() as SpaceMember
        );

      members.sort((a, b) => {
        if (a.role === "host") {
          return -1;
        }

        if (b.role === "host") {
          return 1;
        }

        return a.username.localeCompare(
          b.username
        );
      });

      callback(members);
    },
    (error) => {
      console.error(
        "Erro ao observar participantes:",
        error
      );

      callback([]);
    }
  );
}

/* =========================================================
   TÍTULOS
   ========================================================= */

function spaceTitleId(
  mediaType: "movie" | "tv",
  mediaId: number
): string {
  return `${mediaType}_${mediaId}`;
}

export async function addTitleToSpace(
  spaceId: string,
  title: Omit<
    SpaceTitle,
    "id" | "addedAt"
  >
): Promise<void> {
  const id = spaceTitleId(
    title.mediaType,
    title.mediaId
  );

  const ref = doc(
    db,
    "spaces",
    spaceId,
    "titles",
    id
  );

  await withTimeout(
    setDoc(
      ref,
      {
        ...title,
        id,
        addedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    ),
    "Não foi possível adicionar o título à sessão."
  );
}

export async function getSpaceTitles(
  spaceId: string
): Promise<SpaceTitle[]> {
  const ref =
    collection(
      db,
      "spaces",
      spaceId,
      "titles"
    );

  const snapshot =
    await withTimeout(
      getDocs(ref),
      "O Firebase demorou demais para carregar os títulos da sessão."
    );

  return snapshot.docs
    .map(
      (item) =>
        item.data() as SpaceTitle
    )
    .sort((a, b) => {
      const aTime =
        a.addedAt &&
        typeof a.addedAt ===
          "object" &&
        "toMillis" in
          a.addedAt
          ? Number(
              (
                a.addedAt as {
                  toMillis: () => number;
                }
              ).toMillis()
            )
          : 0;

      const bTime =
        b.addedAt &&
        typeof b.addedAt ===
          "object" &&
        "toMillis" in
          b.addedAt
          ? Number(
              (
                b.addedAt as {
                  toMillis: () => number;
                }
              ).toMillis()
            )
          : 0;

      return aTime - bTime;
    });
}

export function subscribeToSpaceTitles(
  spaceId: string,
  callback: (
    titles: SpaceTitle[]
  ) => void
): () => void {
  const ref =
    collection(
      db,
      "spaces",
      spaceId,
      "titles"
    );

  return onSnapshot(
    ref,
    (snapshot) => {
      const titles =
        snapshot.docs.map(
          (item) =>
            item.data() as SpaceTitle
        );

      titles.sort((a, b) => {
        const aTime =
          a.addedAt &&
          typeof a.addedAt ===
            "object" &&
          "toMillis" in
            a.addedAt
            ? Number(
                (
                  a.addedAt as {
                    toMillis: () => number;
                  }
                ).toMillis()
              )
            : 0;

        const bTime =
          b.addedAt &&
          typeof b.addedAt ===
            "object" &&
          "toMillis" in
            b.addedAt
            ? Number(
                (
                  b.addedAt as {
                    toMillis: () => number;
                  }
                ).toMillis()
              )
            : 0;

        return aTime - bTime;
      });

      callback(titles);
    },
    (error) => {
      console.error(
        "Erro ao observar títulos da sala:",
        error
      );

      callback([]);
    }
  );
}

/* =========================================================
   AVALIAÇÕES
   ========================================================= */

export async function saveSpaceRating(
  spaceId: string,
  mediaType: "movie" | "tv",
  mediaId: number,
  rating: {
    uid: string;
    value: number;
    review: string;
  }
): Promise<void> {
  const titleId =
    spaceTitleId(
      mediaType,
      mediaId
    );

  const ref = doc(
    db,
    "spaces",
    spaceId,
    "titles",
    titleId,
    "ratings",
    rating.uid
  );

  await withTimeout(
    setDoc(
      ref,
      {
        uid:
          rating.uid,
        rating:
          rating.value,
        review:
          rating.review,
        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    ),
    "Não foi possível salvar sua avaliação na sessão."
  );
}

export async function getSpaceRatings(
  spaceId: string,
  mediaType: "movie" | "tv",
  mediaId: number
): Promise<SpaceRating[]> {
  const titleId =
    spaceTitleId(
      mediaType,
      mediaId
    );

  const ref =
    collection(
      db,
      "spaces",
      spaceId,
      "titles",
      titleId,
      "ratings"
    );

  const snapshot =
    await withTimeout(
      getDocs(ref),
      "O Firebase demorou demais para carregar as avaliações."
    );

  return snapshot.docs.map(
    (item) =>
      item.data() as SpaceRating
  );
}

export function subscribeToSpaceRatings(
  spaceId: string,
  mediaType: "movie" | "tv",
  mediaId: number,
  callback: (
    ratings: SpaceRating[]
  ) => void
): () => void {
  const titleId =
    spaceTitleId(
      mediaType,
      mediaId
    );

  const ref =
    collection(
      db,
      "spaces",
      spaceId,
      "titles",
      titleId,
      "ratings"
    );

  return onSnapshot(
    ref,
    (snapshot) => {
      callback(
        snapshot.docs.map(
          (item) =>
            item.data() as SpaceRating
        )
      );
    },
    (error) => {
      console.error(
        "Erro ao observar avaliações da sessão:",
        error
      );

      callback([]);
    }
  );
}

/* =========================================================
   STATUS
   ========================================================= */

export async function startSpace(
  spaceId: string
): Promise<void> {
  const ref = doc(
    db,
    "spaces",
    spaceId
  );

  await withTimeout(
    setDoc(
      ref,
      {
        status: "active",
        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    ),
    "Não foi possível iniciar a sessão."
  );
}

export async function lockSpace(
  spaceId: string
): Promise<void> {
  const ref = doc(
    db,
    "spaces",
    spaceId
  );

  await withTimeout(
    setDoc(
      ref,
      {
        status: "locked",
        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    ),
    "Não foi possível encerrar a sessão."
  );
}
