"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Film,
  Trophy,
  Tv,
  UserRound,
  BookOpen,
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

export default function PodioPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [ratings, setRatings] =
    useState<SavedRating[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(
      async (user) => {
        if (!user) {
          router.replace("/");
          return;
        }

        try {
          const userProfile =
            await getUserProfile(user.uid);

          if (!userProfile) {
            router.replace("/configurar");
            return;
          }

          setProfile(userProfile);

          const savedRatings =
            await getUserRatings(user.uid);

          setRatings(savedRatings);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  const movies = useMemo(
    () =>
      [...ratings]
        .filter(
          (item) =>
            item.mediaType === "movie"
        )
        .sort(
          (a, b) =>
            b.rating - a.rating
        ),
    [ratings]
  );

  const series = useMemo(
    () =>
      [...ratings]
        .filter(
          (item) =>
            item.mediaType === "tv"
        )
        .sort(
          (a, b) =>
            b.rating - a.rating
        ),
    [ratings]
  );

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

  return (
    <main className="retro-grid min-h-screen px-5 pb-16">
      <div className="mx-auto w-full max-w-7xl">

        {/* HEADER */}

        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 py-6">

          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
            aria-label="Voltar para o início"
          >
            <img
              src="/logo.png"
              alt="Dito & Feito"
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/perfil")
            }
            className="flex items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-white/[0.04]"
          >
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
          </button>

        </header>

        {/* NAVEGAÇÃO */}

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-2">

          <NavButton
            icon={<Film size={17} />}
            label="Catálogo"
            onClick={() =>
              router.push("/filmes")
            }
          />

          <NavButton
            icon={<BookOpen size={17} />}
            label="Biblioteca"
            onClick={() =>
              router.push(
                "/filmes/biblioteca"
              )
            }
          />

          <NavButton
            icon={<Trophy size={17} />}
            label="Pódio"
            active
            onClick={() =>
              router.push(
                "/filmes/podio"
              )
            }
          />

          <NavButton
            icon={<UserRound size={17} />}
            label="Perfil"
            onClick={() =>
              router.push("/perfil")
            }
          />

        </nav>

        {/* TÍTULO */}

        <section className="mt-12">

          <div className="text-center">

            <div className="flex items-center justify-center gap-3">
              <Trophy
                size={28}
                className="text-yellow-300"
              />

              <p className="font-pixel text-xs text-yellow-300">
                SEU RANKING
              </p>

              <Trophy
                size={28}
                className="text-yellow-300"
              />
            </div>

            <h1 className="mt-5 font-pixel text-2xl leading-relaxed text-white sm:text-4xl">
              MEU PÓDIO
            </h1>

            <p className="mx-auto mt-4 max-w-2xl font-retro text-2xl text-slate-400">
              Seus filmes e séries favoritos,
              organizados pelas suas próprias notas.
            </p>

          </div>

        </section>

        {/* FILMES */}

        <PodiumSection
          title="FILMES"
          icon={<Film size={18} />}
          items={movies}
        />

        {/* SÉRIES */}

        <PodiumSection
          title="SÉRIES"
          icon={<Tv size={18} />}
          items={series}
        />

      </div>
    </main>
  );
}

function NavButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 font-retro text-xl transition",
        active
          ? "border-pink-400/40 bg-pink-500/10 text-pink-200"
          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

function PodiumSection({
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

      {/* CABEÇALHO */}

      <div className="mb-7 flex items-center gap-4">

        <div className="h-px flex-1 bg-white/10" />

        <h2 className="flex items-center gap-2 font-pixel text-xs text-cyan-300">
          {icon}
          {title}
        </h2>

        <div className="h-px flex-1 bg-white/10" />

      </div>

      {!items.length ? (
        <EmptyPodium />
      ) : (
        <div className="space-y-3">

          {items.map(
            (item, index) => (
              <PodiumRow
                key={
                  item.mediaType +
                  "-" +
                  item.mediaId
                }
                item={item}
                position={index + 1}
              />
            )
          )}

        </div>
      )}

    </section>
  );
}

function PodiumRow({
  item,
  position,
}: {
  item: SavedRating;
  position: number;
}) {
  const isFirst = position === 1;
  const isSecond = position === 2;
  const isThird = position === 3;

  let positionLabel =
    `${position}º`;

  if (isFirst) {
    positionLabel = "🥇";
  } else if (isSecond) {
    positionLabel = "🥈";
  } else if (isThird) {
    positionLabel = "🥉";
  }

  return (
    <article
      className={[
        "grid grid-cols-[58px_72px_1fr_auto] items-center gap-4 rounded-2xl border p-3 transition sm:grid-cols-[70px_90px_1fr_auto] sm:p-4",
        isFirst
          ? "border-yellow-300/40 bg-yellow-300/[0.06] shadow-[0_0_30px_rgba(255,220,80,0.08)]"
          : isSecond
            ? "border-slate-300/20 bg-white/[0.035]"
            : isThird
              ? "border-orange-300/20 bg-orange-300/[0.03]"
              : "border-white/10 bg-white/[0.02] hover:border-white/20",
      ].join(" ")}
    >

      {/* POSIÇÃO */}

      <div className="flex items-center justify-center">

        <span
          className={[
            "font-pixel text-sm",
            isFirst
              ? "text-yellow-300"
              : isSecond
                ? "text-slate-300"
                : isThird
                  ? "text-orange-300"
                  : "text-slate-600",
          ].join(" ")}
        >
          {positionLabel}
        </span>

      </div>

      {/* POSTER */}

      <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#101522]">

        {item.posterPath ? (
          <img
            src={
              `https://image.tmdb.org/t/p/w300${item.posterPath}`
            }
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-center font-retro text-sm text-slate-600">
            SEM
            <br />
            CAPA
          </div>
        )}

      </div>

      {/* INFORMAÇÕES */}

      <div className="min-w-0">

        <h3
          className={[
            "line-clamp-2 font-retro text-xl leading-tight sm:text-2xl",
            isFirst
              ? "text-yellow-100"
              : "text-white",
          ].join(" ")}
        >
          {item.title}
        </h3>

        {item.year && (
          <p className="mt-1 font-retro text-base text-slate-500">
            {item.year}
          </p>
        )}

        {item.review && (
          <p className="mt-2 line-clamp-2 font-retro text-base text-slate-500">
            “{item.review}”
          </p>
        )}

      </div>

      {/* NOTA */}

      <div className="flex min-w-[62px] flex-col items-center justify-center rounded-xl border border-yellow-300/10 bg-yellow-300/[0.04] px-3 py-3">

        <Star
          size={18}
          fill="currentColor"
          className="text-yellow-300"
        />

        <span className="mt-1 font-pixel text-sm text-white">
          {item.rating.toFixed(1)}
        </span>

      </div>

    </article>
  );
}

function EmptyPodium() {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] px-6 text-center">

      <div className="text-5xl">
        🏆
      </div>

      <p className="mt-5 font-pixel text-[10px] text-slate-500">
        NENHUM TÍTULO NO PÓDIO
      </p>

      <p className="mt-3 max-w-md font-retro text-xl text-slate-600">
        Avalie alguns filmes ou séries
        no Catálogo para começar seu ranking.
      </p>

    </div>
  );
}
