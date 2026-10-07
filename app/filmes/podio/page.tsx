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

import {
  subscribeToMembers,
  subscribeToSpace,
  subscribeToSpaceRatings,
  subscribeToSpaceTitles,
  type Space,
  type SpaceMember,
  type SpaceRating,
  type SpaceTitle,
} from "@/lib/spaces";

export default function PodioPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [ratings, setRatings] =
    useState<SavedRating[]>([]);

  const [space, setSpace] =
    useState<Space | null>(null);

  const [members, setMembers] =
    useState<SpaceMember[]>([]);

  const [titles, setTitles] =
    useState<SpaceTitle[]>([]);

  const [spaceRatings, setSpaceRatings] =
    useState<Record<string, SpaceRating[]>>({});

  const [loading, setLoading] =
    useState(true);

  const [spaceLoading, setSpaceLoading] =
    useState(false);

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

          if (
            userProfile.mode !== "solo"
          ) {
            const raw =
              sessionStorage.getItem(
                "ditoefeito_space"
              );

            if (raw) {
              try {
                const parsed =
                  JSON.parse(raw) as Space;

                if (parsed?.id) {
                  setSpace(parsed);
                  setSpaceLoading(true);
                }
              } catch (error) {
                console.error(error);
              }
            }
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!space) {
      return;
    }

    const unsubscribeSpace =
      subscribeToSpace(
        space.id,
        (nextSpace) => {
          if (!nextSpace) return;

          setSpace(nextSpace);

          sessionStorage.setItem(
            "ditoefeito_space",
            JSON.stringify(nextSpace)
          );

          setSpaceLoading(false);
        }
      );

    const unsubscribeMembers =
      subscribeToMembers(
        space.id,
        setMembers
      );

    const unsubscribeTitles =
      subscribeToSpaceTitles(
        space.id,
        setTitles
      );

    return () => {
      unsubscribeSpace();
      unsubscribeMembers();
      unsubscribeTitles();
    };
  }, [space?.id]);

  useEffect(() => {
    if (!space || !titles.length) {
      setSpaceRatings({});
      return;
    }

    const unsubscribers =
      titles.map((title) => {
        const key =
          `${title.mediaType}_${title.mediaId}`;

        return subscribeToSpaceRatings(
          space.id,
          title.mediaType,
          title.mediaId,
          (nextRatings) => {
            setSpaceRatings((current) => ({
              ...current,
              [key]: nextRatings,
            }));
          }
        );
      });

    return () => {
      unsubscribers.forEach(
        (unsubscribe) =>
          unsubscribe()
      );
    };
  }, [space?.id, titles]);

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

  const sharedMovies =
    useMemo(
      () =>
        buildSharedPodium(
          titles,
          spaceRatings,
          "movie"
        ),
      [titles, spaceRatings]
    );

  const sharedSeries =
    useMemo(
      () =>
        buildSharedPodium(
          titles,
          spaceRatings,
          "tv"
        ),
      [titles, spaceRatings]
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

  const sharedMode =
    profile.mode !== "solo" &&
    !!space;

  return (
    <main className="retro-grid min-h-screen px-5 pb-16">
      <div className="mx-auto w-full max-w-7xl">

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

        <section className="mt-12 text-center">

          <div className="flex items-center justify-center gap-3">
            <Trophy
              size={28}
              className="text-yellow-300"
            />

            <p className="font-pixel text-xs text-yellow-300">
              {sharedMode
                ? "PÓDIO DA SESSÃO"
                : "SEU RANKING"}
            </p>

            <Trophy
              size={28}
              className="text-yellow-300"
            />
          </div>

          <h1 className="mt-5 font-pixel text-2xl leading-relaxed text-white sm:text-4xl">
            {sharedMode
              ? space?.name
              : "MEU PÓDIO"}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl font-retro text-2xl text-slate-400">
            {sharedMode
              ? "As notas de vocês juntas. Cada título mostra a média de quem já votou."
              : "Seus filmes e séries favoritos, organizados pelas suas próprias notas."}
          </p>

          {sharedMode && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {members.map((member) => (
                <div
                  key={member.uid}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <span className="text-xl">
                    {member.avatar}
                  </span>

                  <span className="font-retro text-lg text-slate-300">
                    {member.username}
                  </span>
                </div>
              ))}
            </div>
          )}

        </section>

        {sharedMode ? (
          <>
            {spaceLoading ? (
              <div className="mt-14 flex min-h-[220px] items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02]">
                <div className="font-retro text-2xl text-cyan-300">
                  CARREGANDO PÓDIO...
                </div>
              </div>
            ) : (
              <>
                <SharedPodiumSection
                  title="FILMES"
                  icon={<Film size={18} />}
                  items={sharedMovies}
                  totalParticipants={
                    members.length
                  }
                />

                <SharedPodiumSection
                  title="SÉRIES"
                  icon={<Tv size={18} />}
                  items={sharedSeries}
                  totalParticipants={
                    members.length
                  }
                />
              </>
            )}
          </>
        ) : (
          <>
            <PodiumSection
              title="FILMES"
              icon={<Film size={18} />}
              items={movies}
            />

            <PodiumSection
              title="SÉRIES"
              icon={<Tv size={18} />}
              items={series}
            />
          </>
        )}

      </div>
    </main>
  );
}

type SharedPodiumItem = {
  title: SpaceTitle;
  ratings: SpaceRating[];
  average: number;
};

function buildSharedPodium(
  titles: SpaceTitle[],
  ratingsMap: Record<string, SpaceRating[]>,
  mediaType: "movie" | "tv"
): SharedPodiumItem[] {
  return titles
    .filter(
      (title) =>
        title.mediaType === mediaType
    )
    .map((title) => {
      const key =
        `${title.mediaType}_${title.mediaId}`;

      const ratings =
        ratingsMap[key] || [];

      const average =
        ratings.length
          ? ratings.reduce(
              (sum, item) =>
                sum + item.rating,
              0
            ) / ratings.length
          : 0;

      return {
        title,
        ratings,
        average,
      };
    })
    .sort(
      (a, b) =>
        b.average - a.average
    );
}

function SharedPodiumSection({
  title,
  icon,
  items,
  totalParticipants,
}: {
  title: string;
  icon: React.ReactNode;
  items: SharedPodiumItem[];
  totalParticipants: number;
}) {
  return (
    <section className="mt-14">

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
              <SharedPodiumRow
                key={
                  `${item.title.mediaType}-${item.title.mediaId}`
                }
                item={item}
                position={index + 1}
                totalParticipants={
                  totalParticipants
                }
              />
            )
          )}
        </div>
      )}

    </section>
  );
}

function SharedPodiumRow({
  item,
  position,
  totalParticipants,
}: {
  item: SharedPodiumItem;
  position: number;
  totalParticipants: number;
}) {
  const isFirst = position === 1;
  const isSecond = position === 2;
  const isThird = position === 3;

  const voted =
    item.ratings.length;

  const complete =
    voted >= totalParticipants &&
    totalParticipants > 0;

  let positionLabel =
    `${position}º`;

  if (isFirst) positionLabel = "🥇";
  if (isSecond) positionLabel = "🥈";
  if (isThird) positionLabel = "🥉";

  return (
    <article
      className={[
        "grid grid-cols-[58px_72px_1fr_auto] items-center gap-4 rounded-2xl border p-3 sm:grid-cols-[70px_90px_1fr_auto] sm:p-4",
        isFirst
          ? "border-yellow-300/40 bg-yellow-300/[0.06]"
          : isSecond
            ? "border-slate-300/20 bg-white/[0.035]"
            : isThird
              ? "border-orange-300/20 bg-orange-300/[0.03]"
              : "border-white/10 bg-white/[0.02]",
      ].join(" ")}
    >

      <div className="flex items-center justify-center">
        <span className="font-pixel text-sm text-yellow-300">
          {positionLabel}
        </span>
      </div>

      <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#101522]">
        {item.title.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${item.title.posterPath}`}
            alt={item.title.title}
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

      <div className="min-w-0">

        <h3 className="line-clamp-2 font-retro text-xl leading-tight text-white sm:text-2xl">
          {item.title.title}
        </h3>

        {item.title.year && (
          <p className="mt-1 font-retro text-base text-slate-500">
            {item.title.year}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-pixel text-[8px] text-cyan-300">
            {voted}/{totalParticipants} VOTOS
          </span>

          <span
            className={[
              "rounded-full px-3 py-1 font-pixel text-[8px]",
              complete
                ? "bg-green-500/10 text-green-300"
                : "bg-pink-500/10 text-pink-300",
            ].join(" ")}
          >
            {complete
              ? "TODOS VOTARAM"
              : "AGUARDANDO NOTAS"}
          </span>
        </div>

      </div>

      <div className="flex min-w-[72px] flex-col items-center justify-center rounded-xl border border-yellow-300/10 bg-yellow-300/[0.04] px-3 py-3">

        <Star
          size={18}
          fill="currentColor"
          className="text-yellow-300"
        />

        <span className="mt-1 font-pixel text-sm text-white">
          {item.average.toFixed(2)}
        </span>

        <span className="mt-1 font-retro text-xs text-slate-600">
          MÉDIA
        </span>

      </div>

    </article>
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

  if (isFirst) positionLabel = "🥇";
  if (isSecond) positionLabel = "🥈";
  if (isThird) positionLabel = "🥉";

  return (
    <article
      className={[
        "grid grid-cols-[58px_72px_1fr_auto] items-center gap-4 rounded-2xl border p-3 sm:grid-cols-[70px_90px_1fr_auto] sm:p-4",
        isFirst
          ? "border-yellow-300/40 bg-yellow-300/[0.06]"
          : isSecond
            ? "border-slate-300/20 bg-white/[0.035]"
            : isThird
              ? "border-orange-300/20 bg-orange-300/[0.03]"
              : "border-white/10 bg-white/[0.02]",
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

      <div className="min-w-0">
        <h3 className="line-clamp-2 font-retro text-xl leading-tight text-white sm:text-2xl">
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
        Avalie alguns filmes ou séries no Catálogo para começar seu ranking.
      </p>
    </div>
  );
}
