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

/**
 * Limita o tempo de espera de uma operação do Firebase.
 */
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
 * Não utiliza sessionStorage ou localStorage para guardar
 * a sala do usuário.
 */
export async function getUserSpaces(
  uid: string
): Promise<Space[]> {
  if (!uid) {
    return [];
  }

  // Localiza as participações do usuário no Firestore.
  const membersQuery = query(
    collectionGroup(db, "members"),
    where("uid", "==", uid)
  );

  const membersSnapshot = await withTimeout(
    getDocs(membersQuery),
    "O Firebase demorou demais para localizar suas salas."
  );

  if (membersSnapshot.empty) {
    return [];
  }

  // Extrai os IDs das salas e remove possíveis duplicados.
  const spaceIds = Array.from(
    new Set(
      membersSnapshot.docs
        .map(
          (memberDoc) =>
            memberDoc.ref.parent.parent?.id
        )
        .filter((id): id is string => Boolean(id))
    )
  );

  // Busca os documentos das salas em paralelo.
  const loadedSpaces = await Promise.all(
    spaceIds.map(
      async (spaceId): Promise<Space | null> => {
        try {
          const spaceSnapshot = await withTimeout(
            getDoc(doc(db, "spaces", spaceId)),
            "O Firebase demorou demais para carregar uma sala."
          );

          if (!spaceSnapshot.exists()) {
            return null;
          }

          return {
            id: spaceSnapshot.id,
            ...(spaceSnapshot.data() as Omit<
              Space,
              "id"
            >),
          };
        } catch (error) {
          console.error(
            `Erro ao carregar a sala ${spaceId}:`,
            error
          );

          return null;
        }
      }
    )
  );

  // Retorna somente as salas carregadas com sucesso.
  return loadedSpaces.filter(
    (space): space is Space => space !== null
  );
}

/**
 * Escolhe a melhor sala para ser restaurada
 * automaticamente no catálogo.
 *
 * Prioridade:
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

  const activeSpace = spaces.find(
    (space) => space.status === "active"
  );

  if (activeSpace) {
    return activeSpace;
  }

  const waitingSpace = spaces.find(
    (space) => space.status === "waiting"
  );

  if (waitingSpace) {
    return waitingSpace;
  }

  const lockedSpace = spaces.find(
    (space) => space.status === "locked"
  );

  return lockedSpace ?? null;
}
