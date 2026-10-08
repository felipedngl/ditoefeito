"use client";

import { useEffect, useMemo, useState } from "react";
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

  const hasSpace =
    profile.mode !== "solo" &&
    !!profile.spaceName?.trim();

  const modeLabel =
    profile.mode === "couple"
      ? "CASALZINHO"
      : profile.mode === "group"
        ? "GRUPINHO"
        : "SOZINHO";

  const average =
    ratings.length > 0
      ? (
          ratings.reduce(
            (sum, item) =>
              sum + item.rating,
            0
          ) / ratings.length
        ).toFixed(1)
      : "--";

  return (
    <main className="retro-grid min-h-screen text-white">
      <header className="border-b border-white/10 bg-[#070910]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-6">
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
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <nav className="flex gap-2 overflow-x-auto py-5">
          <NavButton
            label="CATÁLOGO"
            active={false}
            onClick={() =>
              router.push("/filmes")
            }
          />

          <NavButton
            label="BIBLIOTECA"
            active={false}
            onClick={() =>
              router.push(
                "/filmes/biblioteca"
              )
            }
          />

          <NavButton
            label="PÓDIO"
            active={false}
            onClick={() =>
              router.push(
                "/filmes/podio"
              )
            }
          />

          <NavButton
            label="PERFIL"
            active
            onClick={() =>
              router.push(
                `/perfil/${profile.usernameSlug}`
              )
            }
          />
        </nav>

        <section className="mt-5">
          <p className="font-pixel text-[9px] text-pink-300">
            PERFIL PÚBLICO
          </p>

          <h1 className="mt-2 font-pixel text-2xl text-white md:text-4xl">
            @{profile.usernameSlug}
          </h1>

          <p className="mt-3 max-w-2xl font-retro text-base leading-6 text-slate-400 md:text-lg">
            O cinema, as notas e o pódio de{" "}
            {profile.username}.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-5 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-pink-400/40 bg-pink-500/10 text-7xl shadow-[0_0_50px_rgba(255,0,127,0.12)]">
              {profile.avatar}
            </div>

            <h2 className="mt-6 font-pixel text-2xl text-white sm:text-3xl">
              {profile.username}
            </h2>

            <div className="mt-2 font-retro text-xl text-slate-500">
              @{profile.usernameSlug}
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-pink-400/20 bg-pink-500/10 px-3 py-2 font-pixel text-[8px] text-pink-300">
                {modeLabel}
              </span>

              {hasSpace && (
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 font-pixel text-[8px] text-cyan-300">
                  💞 {profile.spaceName}
                </span>
              )}
            </div>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
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
              value={average}
            />
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-pixel text-[9px] text-yellow-300">
                RANKING PESSOAL
              </p>

              <h2 className="mt-2 flex items-center gap-2 font-pixel text-xl text-white md:text-2xl">
                <Trophy
                  size={21}
                  className="text-yellow-300"
                />
                PÓDIO DE {profile.username}
              </h2>

              <p className="mt-2 font-retro text-sm text-slate-500">
                As melhores notas dadas por este perfil.
              </p>
            </div>
          </div>

          {ratings.length === 0 ? (
            <EmptyPodium />
          ) : (
            <>
              <PublicPodiumSection
                title="FILMES"
                icon={<Film size={17} />}
                items={movies}
              />

              <PublicPodiumSection
                title="SÉRIES"
                icon={<Tv size={17} />}
                items={series}
              />
            </>
          )}
        </section>

        <section className="mt-14">
          <div className="mb-6">
            <p className="font-pixel text-[9px] text-cyan-300">
              BIBLIOTECA PÚBLICA
            </p>

            <h2 className="mt-2 font-pixel text-xl text-white md:text-2xl">
              TUDO QUE {profile.username.toUpperCase()} JÁ AVALIOU
            </h2>
          </div>

          <PublicLibrarySection
            title="FILMES"
            icon={<Film size={18} />}
            items={movies}
          />

          <PublicLibrarySection
            title="SÉRIES"
            icon={<Tv size={18} />}
            items={series}
          />
        </section>
      </section>
    </main>
  );
}

function PublicPodiumSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: SavedRating[];
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-2 font-pixel text-sm text-white md:text-base">
          {icon}
          {title}
        </h3>

        <span className="font-pixel text-[8px] text-slate-500">
          {items.length}{" "}
          {items.length === 1
            ? "TÍTULO"
            : "TÍTULOS"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-6 text-center">
          <p className="font-pixel text-[8px] text-slate-600">
            NENHUM {title.slice(0, -1)} AVALIADO
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <PublicPodiumRow
              key={`${item.mediaType}_${item.mediaId}`}
              item={item}
              position={index + 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PublicPodiumRow({
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

  if (isFirst) positionLabel = "🥇";
  if (isSecond) positionLabel = "🥈";
  if (isThird) positionLabel = "🥉";

  return (
    <article
      className={[
        "group grid grid-cols-[40px_58px_1fr_auto] items-center gap-3 rounded-2xl border p-3 transition sm:grid-cols-[48px_70px_1fr_auto] sm:gap-4 sm:p-4",
        isFirst
          ? "border-yellow-300/30 bg-yellow-300/[0.06]"
          : isSecond
            ? "border-slate-300/20 bg-white/[0.035]"
            : isThird
              ? "border-orange-300/20 bg-orange-300/[0.035]"
              : "border-white/10 bg-white/[0.02] hover:border-cyan-400/20",
      ].join(" ")}
    >
      <div className="flex items-center justify-center">
        <span className="font-pixel text-sm text-yellow-300">
          {positionLabel}
        </span>
      </div>

      <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#101522]">
        {item.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${item.posterPath}`}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center font-pixel text-[6px] text-slate-600">
            SEM IMAGEM
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="font-pixel text-[7px] text-cyan-300">
          {item.mediaType === "movie"
            ? "FILME"
            : "SÉRIE"}
        </div>

        <h3 className="mt-1 line-clamp-2 font-retro text-base leading-tight text-white sm:text-lg">
          {item.title}
        </h3>

        {item.year && (
          <p className="mt-1 font-retro text-xs text-slate-500">
            {item.year}
          </p>
        )}

        {item.review && (
          <p className="mt-2 line-clamp-2 font-retro text-xs italic text-slate-500">
            “{item.review}”
          </p>
        )}
      </div>

      <div className="flex min-w-[62px] flex-col items-center justify-center rounded-xl border border-yellow-300/10 bg-yellow-300/[0.04] px-2 py-3">
        <Star
          size={15}
          fill="currentColor"
          className="text-yellow-300"
        />

        <span className="mt-1 font-pixel text-sm text-white">
          {item.rating.toFixed(1)}
        </span>

        <span className="mt-1 font-pixel text-[6px] text-slate-500">
          NOTA
        </span>
      </div>
    </article>
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
    <section className="mb-10">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-400/20 bg-pink-500/10 text-pink-300">
          {icon}
        </div>

        <div>
          <div className="font-pixel text-[8px] text-pink-300">
            BIBLIOTECA PÚBLICA
          </div>

          <h3 className="mt-1 font-pixel text-base text-white">
            {title}
          </h3>
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
            loading="lazy"
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

function EmptyPodium() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-300/10 bg-yellow-300/[0.05] text-3xl">
        🏆
      </div>

      <p className="mt-5 font-pixel text-[9px] text-slate-400">
        PÓDIO VAZIO
      </p>

      <p className="mx-auto mt-2 max-w-md font-retro text-sm leading-6 text-slate-600">
        Este perfil ainda não avaliou nenhum
        filme ou série.
      </p>
    </div>
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
        "flex shrink-0 items-center rounded-xl border px-4 py-3 font-pixel text-[9px] transition",
        active
          ? "border-pink-400/40 bg-pink-500/10 text-pink-200"
          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
