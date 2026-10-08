"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Library,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  getUserProfile,
  subscribeToAuth,
  type UserProfile,
} from "@/lib/auth";

import {
  deleteRating,
  getUserRatings,
  type SavedRating,
} from "@/lib/ratings";

export default function BibliotecaPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [ratings, setRatings] = useState<SavedRating[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] =
    useState<SavedRating | null>(null);

  const [deletingKey, setDeletingKey] =
    useState<string | null>(null);

  const [deleteError, setDeleteError] =
    useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      if (!user) {
        setUid(null);
        setProfile(null);
        setRatings([]);
        setLoading(false);
        return;
      }

      setUid(user.uid);

      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);

        const savedRatings = await getUserRatings(user.uid);

        setRatings(savedRatings);
      } catch (error) {
        console.error(
          "Erro ao carregar biblioteca:",
          error
        );
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const movies = ratings.filter(
    (item) => item.mediaType === "movie"
  );

  const tv = ratings.filter(
    (item) => item.mediaType === "tv"
  );

  function editRating(item: SavedRating) {
    router.push(
      `/filmes?edit=${item.mediaType}_${item.mediaId}`
    );
  }

  function openDeleteConfirmation(item: SavedRating) {
    setDeleteError("");
    setDeleteTarget(item);
  }

  function closeDeleteConfirmation() {
    if (deletingKey) return;

    setDeleteTarget(null);
    setDeleteError("");
  }

  async function handleDelete() {
    if (!uid || !deleteTarget) return;

    const key = `${deleteTarget.mediaType}_${deleteTarget.mediaId}`;

    try {
      setDeletingKey(key);
      setDeleteError("");

      await deleteRating(
        uid,
        deleteTarget.mediaType,
        deleteTarget.mediaId
      );

      setRatings((current) =>
        current.filter(
          (item) =>
            !(
              item.mediaType === deleteTarget.mediaType &&
              item.mediaId === deleteTarget.mediaId
            )
        )
      );

      setDeleteTarget(null);
    } catch (error) {
      console.error(
        "Erro ao excluir título:",
        error
      );

      setDeleteError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir este título."
      );
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#070910] text-white">
      <header className="border-b border-white/10 bg-[#070910]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-6">
          <button
            type="button"
            onClick={() => router.push("/filmes")}
            className="flex items-center gap-2 font-pixel text-[10px] text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            CATÁLOGO
          </button>

          <div className="text-center">
            <div className="font-pixel text-[9px] text-pink-300">
              DITO & FEITO
            </div>

            <h1 className="mt-1 font-pixel text-lg text-white">
              BIBLIOTECA
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push("/perfil")}
            className="font-pixel text-[10px] text-slate-300 transition hover:text-white"
          >
            PERFIL
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <Library size={26} />
          </div>

          <div>
            <p className="font-pixel text-[9px] text-cyan-300">
              {profile?.username || "SEU CINEMA"}
            </p>

            <h2 className="mt-1 font-pixel text-xl text-white md:text-2xl">
              MINHA BIBLIOTECA
            </h2>

            <p className="mt-2 font-retro text-sm text-slate-400">
              {ratings.length}{" "}
              {ratings.length === 1
                ? "título avaliado"
                : "títulos avaliados"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center font-retro text-slate-500">
            Carregando sua biblioteca...
          </div>
        ) : ratings.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="font-pixel text-sm text-white">
              SUA BIBLIOTECA ESTÁ VAZIA
            </div>

            <p className="mx-auto mt-3 max-w-md font-retro text-base text-slate-400">
              Vá até o catálogo, escolha um filme ou série e
              dê sua primeira nota.
            </p>

            <button
              type="button"
              onClick={() => router.push("/filmes")}
              className="mt-6 rounded-2xl bg-pink-500 px-6 py-4 font-pixel text-[10px] text-white transition hover:bg-pink-400"
            >
              IR PARA O CATÁLOGO
            </button>
          </div>
        ) : (
          <>
            <LibrarySection
              title="FILMES"
              items={movies}
              onEdit={editRating}
              onDelete={openDeleteConfirmation}
              deletingKey={deletingKey}
            />

            <LibrarySection
              title="SÉRIES"
              items={tv}
              onEdit={editRating}
              onDelete={openDeleteConfirmation}
              deletingKey={deletingKey}
            />
          </>
        )}
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-pink-400/20 bg-[#0c101c] p-6 shadow-2xl shadow-pink-500/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-pixel text-[9px] text-pink-300">
                  MINHA BIBLIOTECA
                </p>

                <h2 className="mt-2 font-pixel text-base text-white">
                  EXCLUIR DA BIBLIOTECA?
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDeleteConfirmation}
                disabled={!!deletingKey}
                className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-[#101522]">
                {deleteTarget.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${deleteTarget.posterPath}`}
                    alt={deleteTarget.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center font-retro text-[10px] text-slate-500">
                    Sem imagem
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="line-clamp-2 font-retro text-base font-semibold text-white">
                  {deleteTarget.title}
                </h3>

                <div className="mt-2 flex items-center gap-1 font-pixel text-[9px] text-yellow-300">
                  <Star
                    size={11}
                    fill="currentColor"
                  />
                  {deleteTarget.rating.toFixed(1)}
                </div>
              </div>
            </div>

            <p className="mt-5 font-retro text-sm leading-6 text-slate-400">
              Isso apagará sua nota e sua crítica deste título.
              O filme ou série continuará existindo no catálogo
              e isso não afetará uma eventual sessão compartilhada.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 font-retro text-sm text-red-200">
                {deleteError}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirmation}
                disabled={!!deletingKey}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 font-pixel text-[9px] text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
              >
                CANCELAR
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={!!deletingKey}
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-500/90 px-4 py-4 font-pixel text-[9px] text-white transition hover:bg-red-400 disabled:cursor-wait disabled:opacity-50"
              >
                <Trash2 size={14} />

                {deletingKey
                  ? "EXCLUINDO..."
                  : "EXCLUIR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function LibrarySection({
  title,
  items,
  onEdit,
  onDelete,
  deletingKey,
}: {
  title: string;
  items: SavedRating[];
  onEdit: (item: SavedRating) => void;
  onDelete: (item: SavedRating) => void;
  deletingKey: string | null;
}) {
  if (items.length === 0) {
    return (
      <section className="mb-12">
        <div className="mb-5">
          <h2 className="font-pixel text-lg text-white">
            {title}
          </h2>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 font-retro text-sm text-slate-500">
          Nenhum título nesta categoria ainda.
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="font-pixel text-[9px] text-cyan-300">
            SUA COLEÇÃO
          </p>

          <h2 className="mt-1 font-pixel text-lg text-white md:text-xl">
            {title}
          </h2>
        </div>

        <div className="font-pixel text-[9px] text-slate-500">
          {items.length}{" "}
          {items.length === 1 ? "TÍTULO" : "TÍTULOS"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => {
          const key = `${item.mediaType}_${item.mediaId}`;
          const isDeleting = deletingKey === key;

          return (
            <div
              key={key}
              className="group min-w-0"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#101522]">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="absolute inset-0 z-0"
                  aria-label={`Editar nota de ${item.title}`}
                >
                  {item.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center font-retro text-sm text-slate-500">
                      Sem imagem
                    </div>
                  )}
                </button>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-12">
                  <div className="flex items-center gap-1 font-pixel text-[9px] text-yellow-300">
                    <Star
                      size={11}
                      fill="currentColor"
                    />
                    {item.rating.toFixed(1)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  disabled={isDeleting}
                  aria-label={`Excluir ${item.title}`}
                  className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/30 bg-black/70 text-red-300 opacity-100 backdrop-blur-sm transition hover:border-red-300/60 hover:bg-red-500/20 hover:text-red-200 disabled:cursor-wait disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onEdit(item)}
                className="mt-2 block w-full text-left"
              >
                <div className="line-clamp-2 font-retro text-sm text-white transition group-hover:text-pink-300">
                  {item.title}
                </div>

                <div className="mt-1 font-pixel text-[8px] uppercase text-slate-500">
                  {item.year || "—"}
                </div>

                {item.review && (
                  <p className="mt-2 line-clamp-2 font-retro text-xs italic text-slate-500">
                    “{item.review}”
                  </p>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
