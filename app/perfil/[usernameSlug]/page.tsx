"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Film,
  Star,
  Trophy,
  Tv,
  UserRound,
} from "lucide-react";

import {
  getPublicProfileBySlug,
  type UserProfile,
} from "@/lib/auth";

import {
  getUserRatings,
  type SavedRating,
} from "@/lib/ratings";

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();

  const usernameSlug = String(
    params?.usernameSlug || ""
  );

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [ratings, setRatings] =
    useState<SavedRating[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!usernameSlug) return;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const publicProfile =
          await getPublicProfileBySlug(
            usernameSlug
          );

        if (!publicProfile) {
          setError("Perfil não encontrado.");
          return;
        }

        setProfile(publicProfile);

        const publicRatings =
          await getUserRatings(
            publicProfile.uid
          );

        setRatings(publicRatings);
      } catch (err) {
        console.error(err);

        setError(
          "Não foi possível carregar este perfil."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [usernameSlug]);

  if (loading) {
    return (
      <main className="retro-grid flex min-h-screen items-center justify-center">
        <div className="font-pixel text-sm text-pink-400">
          CARREGANDO PERFIL...
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="retro-grid flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/30 p-8 text-center">
          <UserRound
            size={42}
            className="mx-auto text-pink-400"
          />

          <h1 className="mt-5 font-pixel text-lg text-white">
            PERFIL NÃO ENCONTRADO
          </h1>

          <p className="mt-4 font-retro text-xl text-slate-400">
            {error ||
              "Esse perfil não existe ou não está disponível."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-7 rounded-xl bg-pink-500 px-6 py-4 font-pixel text-[10px] text-white transition hover:bg-pink-400"
          >
            VOLTAR AO INÍCIO
          </button>
        </div>
      </main>
    );
  }

  const movies = ratings.filter(
    (item) => item.mediaType === "movie"
  );

  const series = ratings.filter(
    (item) => item.mediaType === "tv"
  );

  return (
    <main className="retro-grid min-h-screen px-5 pb-16">
      <div className="mx-auto w-full max-w-6xl">

        {/* HEADER */}

        <header className="flex items-center justify-between border-b border-white/10 py-6">

          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <img
              src="/logo.png"
              alt="Dito & Feito"
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          </button>

          <button
            type="button"
            onClick={() => router.push("/filmes")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-pixel text-[9px] text-slate-300 transition hover:border-pink-400/40 hover:text-white"
          >
            <ArrowLeft size={15} />
            MEU CINEMA
          </button>

        </header>

        {/* PERFIL */}

        <section className="mt-10 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur sm:p-10">

          <div className="flex flex-col items-center text-center">

            <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-pink-400/40 bg-pink-500/10 text-7xl shadow-[0_0_50px_rgba(255,0,127,0.12)]">
              {profile.avatar}
            </div>

            <h1 className="mt-6 font-pixel text-2xl text-white sm:text-3xl">
              {profile.username}
            </h1>

            <div className="mt-2 font-retro text-xl text-slate-500">
              @{profile.usernameSlug}
            </div>

            <div className="mt-5 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 font-pixel text-[9px] text-cyan-300">
              PERFIL PÚBLICO
            </div>

          </div>

          {/* ESTATÍSTICAS */}

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">

            <StatCard
              label="TÍTULOS"
              value={ratings.length}
            />

            <StatCard
              label="FILMES"
              value={movies.length}
            />

            <StatCard
              label="SÉRIES"
              value={series.length}
            />

            <StatCard
              label="MÉDIA"
              value={
                ratings.length
                  ? (
                      ratings.reduce(
                        (sum, item) =>
                          sum + item.rating,
                        0
                      ) / ratings.length
                    ).toFixed(1)
                  : "--"
              }
            />

          </div>

        </section>

        {/* FILMES */}

        <PublicLibrarySection
          title="FILMES"
          icon={<Film size={18} />}
          items={movies}
        />

        {/* SÉRIES */}

        <PublicLibrarySection
          title="SÉRIES"
          icon={<Tv size={18} />}
          items={series}
        />

        {ratings.length === 0 && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-black/20 p-10 text-center">
            <Trophy
              size={36}
              className="mx-auto text-pink-400"
            />

            <div className="mt-5 font-pixel text-sm text-white">
              A BIBLIOTECA AINDA ESTÁ VAZIA
            </div>

            <p className="mt-3 font-retro text-lg text-slate-500">
              Este perfil ainda não avaliou nenhum título.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}

function PublicLibrarySection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: SavedRating[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">

      <div className="mb-5 flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-400/20 bg-pink-500/10 text-pink-300">
          {icon}
        </div>

        <div>
          <div className="font-pixel text-[9px] text-pink-300">
            BIBLIOTECA PÚBLICA
          </div>

          <h2 className="mt-1 font-pixel text-lg text-white">
            {title}
          </h2>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

        {items.map((item) => (
          <PublicRatingCard
            key={`${item.mediaType}_${item.mediaId}`}
            item={item}
          />
        ))}

      </div>

    </section>
  );
}

function PublicRatingCard({
  item,
}: {
  item: SavedRating;
}) {
  return (
    <article className="min-w-0">

      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#101522]">

        {item.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center font-retro text-sm text-slate-500">
            Sem imagem
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-12">

          <div className="flex items-center gap-1 font-pixel text-[10px] text-yellow-300">
            <Star
              size={12}
              fill="currentColor"
            />

            {item.rating.toFixed(1)}
          </div>

        </div>

      </div>

      <div className="mt-2 line-clamp-2 font-retro text-sm text-white">
        {item.title}
      </div>

      <div className="mt-1 font-pixel text-[8px] text-slate-500">
        {item.year || "—"}
      </div>

      {item.review && (
        <p className="mt-2 line-clamp-3 font-retro text-xs italic leading-relaxed text-slate-500">
          “{item.review}”
        </p>
      )}

    </article>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-center">

      <div className="font-pixel text-[8px] text-slate-600">
        {label}
      </div>

      <div className="mt-2 font-pixel text-lg text-white">
        {value}
      </div>

    </div>
  );
}
