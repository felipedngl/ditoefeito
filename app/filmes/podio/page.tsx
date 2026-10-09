"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Film,
  Star,
  Trophy,
  Tv,
  UserRound,
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
  getUserSpaces,
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

  const [userSpaces, setUserSpaces] =
  useState<Space[]>([]);

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

          const joinedSpaces =
            await getUserSpaces(user.uid);
          
          setUserSpaces(joinedSpaces);
          setSpace(null);
          
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
    setMembers([]);
    setTitles([]);
    setSpaceRatings({});
    setSpaceLoading(false);
    return;
  }

  const unsubscribeSpace =
    subscribeToSpace(
      space.id,
      (nextSpace) => {
        if (!nextSpace) return;

        setSpace(nextSpace);
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
          CARREGANDO PÓDIO...
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

const sharedMode = !!space;

function selectPersonalPodium() {
  setSpace(null);
  setSpaceLoading(false);
}

function selectGroupPodium(selectedSpace: Space) {
  setMembers([]);
  setTitles([]);
  setSpaceRatings({});
  setSpaceLoading(true);
  setSpace(selectedSpace);
}

  return (
    <main className="retro-grid min-h-screen text-white">
      <header className="border-b border-white/10 bg-[#070910]/90 backdrop-blur-xl">
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
              PÓDIO
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/perfil")
            }
            className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-white/[0.04]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xl">
              {profile.avatar}
            </div>

            <div className="hidden text-left sm:block">
              <div className="font-pixel text-[9px] text-white">
                {profile.username}
              </div>

              <div className="font-retro text-sm text-slate-500">
                @{profile.usernameSlug}
              </div>
            </div>
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <nav className="flex gap-2 overflow-x-auto py-5">
          <NavButton
            icon={<Film size={16} />}
            label="CATÁLOGO"
            onClick={() =>
              router.push("/filmes")
            }
          />

          <NavButton
            icon={<BookOpen size={16} />}
            label="BIBLIOTECA"
            onClick={() =>
              router.push(
                "/filmes/biblioteca"
              )
            }
          />

          <NavButton
            icon={<Trophy size={16} />}
            label="PÓDIO"
            active
            onClick={() =>
              router.push(
                "/filmes/podio"
              )
            }
          />

          <NavButton
            icon={<UserRound size={16} />}
            label="PERFIL"
            onClick={() =>
              router.push("/perfil")
            }
          />
        </nav>

<div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.025] p-3">
  <p className="px-2 pb-3 font-pixel text-[8px] text-slate-500">
    ESCOLHA SEU PÓDIO
  </p>

  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={selectPersonalPodium}
      className={[
        "rounded-xl border px-4 py-3 font-pixel text-[8px] transition",
        !sharedMode
          ? "border-pink-400/40 bg-pink-500/10 text-pink-200"
          : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white",
      ].join(" ")}
    >
      MEU PÓDIO
    </button>

    {userSpaces.map((userSpace) => (
      <button
        key={userSpace.id}
        type="button"
        onClick={() => selectGroupPodium(userSpace)}
        className={[
          "rounded-xl border px-4 py-3 font-pixel text-[8px] transition",
          space?.id === userSpace.id
            ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200"
            : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white",
        ].join(" ")}
      >
        {userSpace.name}
      </button>
    ))}
  </div>

  {userSpaces.length === 0 && (
    <p className="px-2 pt-3 font-retro text-sm text-slate-500">
      Você ainda não participa de grupos. Quando entrar em um, ele aparecerá aqui.
    </p>
  )}
</div>
        
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-pixel text-[9px] text-yellow-300">
              {sharedMode
                ? "RANKING DA SESSÃO"
                : "SEU CINEMA · SUAS NOTAS"}
            </p>

            <h2 className="mt-2 font-pixel text-2xl leading-tight text-white md:text-4xl">
              {sharedMode
                ? space?.name
                : "MEU PÓDIO"}
            </h2>

            <p className="mt-3 max-w-2xl font-retro text-base leading-6 text-slate-400 md:text-lg">
              {sharedMode
                ? "Os títulos da sessão organizados pela média das notas de quem já votou."
                : "Seus filmes e séries organizados pelas notas que você deu."}
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-300/20 bg-yellow-300/10 text-yellow-300">
            <Trophy size={30} />
          </div>
        </div>

        {sharedMode && (
          <div className="mt-6 rounded-3xl border border-pink-400/10 bg-white/[0.025] p-4">
            <div className="font-pixel text-[8px] text-pink-300">
              PARTICIPANTES
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {members.map((member) => (
                <div
                  key={member.uid}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <span className="text-lg">
                    {member.avatar}
                  </span>

                  <span className="font-retro text-sm text-slate-300">
                    {member.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sharedMode ? (
          <div className="mt-10">
            {spaceLoading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.025]">
                <div className="font-pixel text-[10px] text-cyan-300">
                  CARREGANDO PÓDIO...
                </div>
              </div>
            ) : (
              <>
                <SharedPodiumSection
                  title="FILMES"
                  icon={<Film size={17} />}
                  items={sharedMovies}
                  totalParticipants={
                    members.length
                  }
                />

                <SharedPodiumSection
                  title="SÉRIES"
                  icon={<Tv size={17} />}
                  items={sharedSeries}
                  totalParticipants={
                    members.length
                  }
                />
              </>
            )}
          </div>
        ) : (
          <div className="mt-10">
            <PodiumSection
              title="FILMES"
              icon={<Film size={17} />}
              items={movies}
            />

            <PodiumSection
              title="SÉRIES"
              icon={<Tv size={17} />}
              items={series}
            />
          </div>
        )}
      </section>
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
    <section className="mb-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="font-pixel text-[9px] text-cyan-300">
            SESSÃO COMPARTILHADA
          </p>

          <h2 className="mt-1 flex items-center gap-2 font-pixel text-lg text-white md:text-xl">
            {icon}
            {title}
          </h2>
        </div>

        <div className="font-pixel text-[8px] text-slate-500">
          {items.length}{" "}
          {items.length === 1
            ? "TÍTULO"
            : "TÍTULOS"}
        </div>
      </div>

      {!items.length ? (
        <EmptyPodium
          shared
          title={title}
        />
      ) : (
        <div className="space-y-4">
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
        "group grid grid-cols-[42px_64px_1fr_auto] items-center gap-3 rounded-3xl border p-3 transition sm:grid-cols-[52px_80px_1fr_auto] sm:gap-4 sm:p-4",
        isFirst
          ? "border-yellow-300/30 bg-yellow-300/[0.06]"
          : isSecond
            ? "border-slate-300/20 bg-white/[0.035]"
            : isThird
              ? "border-orange-300/20 bg-orange-300/[0.035]"
              : "border-white/10 bg-white/[0.025] hover:border-cyan-400/20",
      ].join(" ")}
    >
      <div className="flex items-center justify-center">
        <span className="font-pixel text-sm text-yellow-300">
          {positionLabel}
        </span>
      </div>

      <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#101522]">
        {item.title.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${item.title.posterPath}`}
            alt={item.title.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center font-pixel text-[7px] text-slate-600">
            SEM IMAGEM
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="font-pixel text-[7px] text-cyan-300">
          {item.title.mediaType === "movie"
            ? "FILME"
            : "SÉRIE"}
        </div>

        <h3 className="mt-1 line-clamp-2 font-retro text-base leading-tight text-white sm:text-lg">
          {item.title.title}
        </h3>

        {item.title.year && (
          <p className="mt-1 font-retro text-xs text-slate-500">
            {item.title.year}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-pixel text-[7px] text-cyan-300">
            {voted}/{totalParticipants} VOTOS
          </span>

          <span
            className={[
              "rounded-full px-2.5 py-1 font-pixel text-[7px]",
              complete
                ? "bg-green-500/10 text-green-300"
                : "bg-pink-500/10 text-pink-300",
            ].join(" ")}
          >
            {complete
              ? "TODOS VOTARAM"
              : "AGUARDANDO"}
          </span>
        </div>
      </div>

      <div className="flex min-w-[68px] flex-col items-center justify-center rounded-2xl border border-yellow-300/10 bg-yellow-300/[0.04] px-2.5 py-3">
        <Star
          size={17}
          fill="currentColor"
          className="text-yellow-300"
        />

        <span className="mt-1 font-pixel text-sm text-white">
          {voted
            ? item.average.toFixed(2)
            : "--"}
        </span>

        <span className="mt-1 font-pixel text-[7px] text-slate-500">
          MÉDIA
        </span>
      </div>
    </article>
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
    <section className="mb-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="font-pixel text-[9px] text-cyan-300">
            SUA COLEÇÃO
          </p>

          <h2 className="mt-1 flex items-center gap-2 font-pixel text-lg text-white md:text-xl">
            {icon}
            {title}
          </h2>
        </div>

        <div className="font-pixel text-[8px] text-slate-500">
          {items.length}{" "}
          {items.length === 1
            ? "TÍTULO"
            : "TÍTULOS"}
        </div>
      </div>

      {!items.length ? (
        <EmptyPodium
          title={title}
        />
      ) : (
        <div className="space-y-4">
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
        "group grid grid-cols-[42px_64px_1fr_auto] items-center gap-3 rounded-3xl border p-3 transition sm:grid-cols-[52px_80px_1fr_auto] sm:gap-4 sm:p-4",
        isFirst
          ? "border-yellow-300/30 bg-yellow-300/[0.06]"
          : isSecond
            ? "border-slate-300/20 bg-white/[0.035]"
            : isThird
              ? "border-orange-300/20 bg-orange-300/[0.035]"
              : "border-white/10 bg-white/[0.025] hover:border-cyan-400/20",
      ].join(" ")}
    >
      <div className="flex items-center justify-center">
        <span className="font-pixel text-sm text-yellow-300">
          {positionLabel}
        </span>
      </div>

      <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#101522]">
        {item.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${item.posterPath}`}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center font-pixel text-[7px] text-slate-600">
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

      <div className="flex min-w-[68px] flex-col items-center justify-center rounded-2xl border border-yellow-300/10 bg-yellow-300/[0.04] px-2.5 py-3">
        <Star
          size={17}
          fill="currentColor"
          className="text-yellow-300"
        />

        <span className="mt-1 font-pixel text-sm text-white">
          {item.rating.toFixed(1)}
        </span>

        <span className="mt-1 font-pixel text-[7px] text-slate-500">
          NOTA
        </span>
      </div>
    </article>
  );
}

function EmptyPodium({
  shared = false,
  title = "",
}: {
  shared?: boolean;
  title?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-300/10 bg-yellow-300/[0.05] text-2xl">
        🏆
      </div>

      <p className="mt-4 font-pixel text-[9px] text-slate-400">
        {title
          ? `${title} AINDA ESTÁ VAZIO`
          : "PÓDIO VAZIO"}
      </p>

      <p className="mx-auto mt-2 max-w-md font-retro text-sm leading-6 text-slate-600">
        {shared
          ? "Adicione títulos à sessão e comece a votar para montar este ranking."
          : "Avalie alguns filmes ou séries no Catálogo para começar seu ranking."}
      </p>
    </div>
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
        "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 font-pixel text-[9px] transition",
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
