import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";

export type SavedRating = {
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  year: string;
  tmdbRating: number;
  tmdbVoteCount: number;
  rating: number;
  review: string;
  createdAt?: unknown;
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

function ratingDocId(
  mediaType: SavedRating["mediaType"],
  mediaId: number
) {
  return `${mediaType}_${mediaId}`;
}

export async function getSavedRating(
  uid: string,
  mediaType: SavedRating["mediaType"],
  mediaId: number
): Promise<SavedRating | null> {
  const ref = doc(
    db,
    "users",
    uid,
    "ratings",
    ratingDocId(mediaType, mediaId)
  );

  const snapshot = await withTimeout(
    getDoc(ref),
    "O Firebase demorou demais para carregar sua avaliação."
  );

  return snapshot.exists()
    ? (snapshot.data() as SavedRating)
    : null;
}

export async function saveRating(
  uid: string,
  rating: Omit<SavedRating, "createdAt" | "updatedAt">
): Promise<void> {
  const ref = doc(
    db,
    "users",
    uid,
    "ratings",
    ratingDocId(rating.mediaType, rating.mediaId)
  );

  const existing = await withTimeout(
    getDoc(ref),
    "O Firebase demorou demais para acessar sua avaliação."
  );

  await withTimeout(
    setDoc(
      ref,
      {
        ...rating,
        updatedAt: serverTimestamp(),
        ...(existing.exists()
          ? {}
          : {
              createdAt: serverTimestamp(),
            }),
      },
      { merge: true }
    ),
    "O Firebase demorou demais para salvar sua avaliação."
  );
}

export async function deleteRating(
  uid: string,
  mediaType: SavedRating["mediaType"],
  mediaId: number
): Promise<void> {
  const ref = doc(
    db,
    "users",
    uid,
    "ratings",
    ratingDocId(mediaType, mediaId)
  );

  await withTimeout(
    deleteDoc(ref),
    "O Firebase demorou demais para excluir este título."
  );
}

export async function getUserRatings(
  uid: string
): Promise<SavedRating[]> {
  const snapshot = await withTimeout(
    getDocs(
      collection(db, "users", uid, "ratings")
    ),
    "O Firebase demorou demais para carregar sua biblioteca."
  );

  return snapshot.docs
    .map(
      (item) =>
        item.data() as SavedRating
    )
    .sort((a, b) => {
      const aTime =
        a.updatedAt &&
        typeof a.updatedAt === "object" &&
        "toMillis" in a.updatedAt
          ? Number(
              (
                a.updatedAt as {
                  toMillis: () => number;
                }
              ).toMillis()
            )
          : 0;

      const bTime =
        b.updatedAt &&
        typeof b.updatedAt === "object" &&
        "toMillis" in b.updatedAt
          ? Number(
              (
                b.updatedAt as {
                  toMillis: () => number;
                }
              ).toMillis()
            )
          : 0;

      return bTime - aTime;
    });
}
