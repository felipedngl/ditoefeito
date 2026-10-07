"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Library,
  Star,
} from "lucide-react";

import {
  getUserProfile,
  subscribeToAuth,
  type UserProfile,
} from "@/lib/auth";

import {
  getUserRatings,
  type SavedRating,
} from "@/lib/ratings";

export default function BibliotecaPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(
    null
  );
  const [uid, setUid] = useState<string | null>(null);
  const [ratings, setRatings] = useState<SavedRating[]>([]);
  const [loading, setLoading] = useState(true);

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

        const savedRatings = await getUserRatings(
          user.uid
        );

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
            />

            <LibrarySection
              title="SÉRIES"
              items={tv}
              onEdit={editRating}
            />
          </>
        )}
      </section>
    </main>
  );
}

function LibrarySection({
  title,
  items,
  onEdit,
}: {
  title: string;
  items: SavedRating[];
  onEdit: (item: SavedRating) => void;
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
        {items.map((item) => (
          <button
            key={`${item.mediaType}_${item.mediaId}`}
            type="button"
            onClick={() => onEdit(item)}
            className="group min-w-0 text-left"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#101522]">
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

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-12">
                <div className="flex items-center gap-1 font-pixel text-[9px] text-yellow-300">
                  <Star
                    size={11}
                    fill="currentColor"
                  />
                  {item.rating.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="mt-2 line-clamp-2 font-retro text-sm text-white transition group-hover:text-pink-300">
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
        ))}
      </div>
    </section>
  );
}
