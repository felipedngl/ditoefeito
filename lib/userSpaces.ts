import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "./firebase";
import type { Space } from "./spaces";

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

/**
 * Localiza todas as salas das quais o usuário participa.
 *
 * A participação é descoberta diretamente no Firestore,
 * através da coleção:
 *
 * spaces/{spaceId}/members/{uid}
 *
 * Não usa sessionStorage, localStorage ou qualquer
 * armazenamento local para guardar a sala.
 */
export async function getUserSpaces(
  uid: string
): Promise<Space[]> {
  if (!uid) {
    return [];
  }

  const membersQuery = query(
    collectionGroup(db, "members"),
    where("uid", "==", uid)
  );

  const membersSnapshot =
    await withTimeout(
      getDocs(membersQuery),
      "O Firebase demorou demais para localizar suas salas."
    );

  if (membersSnapshot.empty) {
    return [];
  }

  const spaces = new Map<string, Space>();

  for (const memberDoc of membersSnapshot.docs) {
    const spaceRef =
      memberDoc.ref.parent.parent;

    if (!spaceRef) {
      continue;
    }

    if (spaces.has(spaceRef.id)) {
      continue;
    }

    try {
      const spaceSnapshot =
        await withTimeout(
          getDoc(
            doc(
              db,
              "spaces",
              spaceRef.id
            )
          ),
          "O Firebase demorou demais para carregar uma sala."
        );

      if (!spaceSnapshot.exists()) {
        continue;
      }

      spaces.set(
        spaceSnapshot.id,
        {
          id: spaceSnapshot.id,
          ...(spaceSnapshot.data() as Omit<
            Space,
            "id"
          >),
        }
      );
    } catch (error) {
      console.error(
        "Erro ao carregar sala do usuário:",
        error
      );
    }
  }

  return Array.from(
    spaces.values()
  );
}

/**
 * Escolhe a melhor sala para ser restaurada
 * automaticamente no catálogo.
 *
 * Prioridade:
 *
 * 1. Sala ativa
 * 2. Sala aguardando participantes
 * 3. Sala bloqueada
 */
export function getPreferredUserSpace(
  spaces: Space[]
): Space | null {
  if (spaces.length === 0) {
    return null;
  }

  const activeSpace =
    spaces.find(
      (space) =>
        space.status === "active"
    );

  if (activeSpace) {
    return activeSpace;
  }

  const waitingSpace =
    spaces.find(
      (space) =>
        space.status === "waiting"
    );

  if (waitingSpace) {
    return waitingSpace;
  }

  const lockedSpace =
    spaces.find(
      (space) =>
        space.status === "locked"
    );

  return lockedSpace ?? null;
}
