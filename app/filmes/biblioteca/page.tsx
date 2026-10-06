"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Film,
  Star,
  Tv,
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

const TMDB_IMAGE_BASE =
  "https://image.tmdb.org/t/p/w500";

export default function BibliotecaPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [ratings, setRatings] =
    useState<SavedRating[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      subscribeToAuth(async (user) => {
        if (!user) {
          router.replace("/");
          return;
        }

        try {
          const userProfile =
            await getUserProfile(user.uid);

          if (!userProfile) {
            router.replace(
              "/configurar"
            );
            return;
          }

          setProfile(userProfile);

          const savedRatings =
            await getUserRatings(
              user.uid
            );

          setRatings(savedRatings);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <main className="retro-grid flex min-h-screen items-center justify-center">
        <div className="font-pixel text-sm text-pink-400">
          CARREGANDO...
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  const movies =
    ratings.filter(
      (item) =>
        item.mediaType === "movie"
    );

  const series =
    ratings.filter(
      (item) =>
        item.mediaType === "tv"
    );

  return (
    <main className="retro-grid min-h-screen px-5 pb-16">

      <div className="mx-auto w-full max-w-7xl">

        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 py-6">

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

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-2xl">
              {profile.avatar}
            </div>

            <div className="hidden text-left sm:block">

              <div className="font-pixel text-[10px] text-white">
                {profile.username}
              </div>

              <div className="font-retro text-lg text-slate-500">
                @{profile.usernameSlug}
              </div>

            </div>

          </div>

        </header>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-2">

          <NavButton
            label="Catálogo"
            onClick={() =>
              router.push("/filmes")
            }
          />

          <NavButton
            label="Biblioteca"
            active
            onClick={() =>
              router.push(
                "/filmes/biblioteca"
              )
            }
          />

          <NavButton
            label="Pódio"
            onClick={() =>
              router.push(
                "/filmes/podio"
              )
            }
          />

          <NavButton
            label="Perfil"
            onClick={() =>
              router.push("/perfil")
            }
          />

        </nav>

        <section className="mt-12">

          <button
            type="button"
            onClick={() =>
              router.push("/filmes")
            }
            className="mb-7 flex items-center gap-2 font-retro text-xl text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Voltar para filmes
          </button>

          <div className="text-center">

            <p className="font-pixel text-xs text-cyan-300">
              SUA COLEÇÃO
            </p>

            <h1 className="mt-4 font-pixel text-2xl text-white sm:text-4xl">
              MINHA BIBLIOTECA
            </h1>

            <p className="mx-auto mt-4 max-w-2xl font-retro text-2xl text-slate-400">
              Tudo o que você já avaliou
              fica guardado aqui.
            </p>

          </div>

        </section>

        <LibrarySection
          title="FILMES"
          icon={<Film size={17} />}
          items={movies}
        />

        <LibrarySection
          title="SÉRIES"
          icon={<Tv size={17} />}
          items={series}
        />

      </div>

    </main>
  );
}

function NavButton({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "shrink-0 rounded-xl border px-4 py-3 font-retro text-xl transition",
        active
          ? "border-pink-400/40 bg-pink-500/10 text-pink-200"
          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function LibrarySection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: SavedRating[];
}) {
  return (
    <section className="mt-14">

      <div className="mb-5 flex items-center gap-4">

        <div className="h-px flex-1 bg-white/10" />

        <h2 className="flex items-center gap-2 font-pixel text-xs text-cyan-300">
          {icon}
          {title}
        </h2>

        <div className="h-px flex-1 bg-white/10" />

      </div>

      {!items.length ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02]">

          <p className="font-retro text-xl text-slate-600">
            Você ainda não avaliou nenhum título.
          </p>

        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

          {items.map((item) => (

            <div
              key={
                item.mediaType +
                "-" +
                item.mediaId
              }
              className="min-w-0"
            >

              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#101522]">

                {item.posterPath ? (
                  <img
                    src={
                      TMDB_IMAGE_BASE +
                      item.posterPath
                    }
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-retro text-xl text-slate-600">
                    SEM CAPA
                  </div>
                )}

              </div>

              <div className="mt-3 line-clamp-2 font-retro text-xl leading-tight text-white">
                {item.title}
              </div>

              <div className="mt-1 flex items-center gap-1 font-retro text-lg text-yellow-300">

                <Star
                  size={14}
                  fill="currentColor"
                />

                {item.rating.toFixed(1)}

              </div>

              {item.review && (
                <p className="mt-2 line-clamp-3 font-retro text-base text-slate-500">
                  “{item.review}”
                </p>
              )}

            </div>

          ))}

        </div>
      )}

    </section>
  );
}
