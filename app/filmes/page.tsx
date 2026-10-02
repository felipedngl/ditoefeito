"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Film,
  Search,
  Trophy,
  UserRound,
  X,
  Star,
  Tv,
} from "lucide-react";

import {
  getUserProfile,
  subscribeToAuth,
  type UserProfile,
} from "@/lib/auth";

type MediaType = "movie" | "tv";

type MediaItem = {
  id: number;
  type: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  year: string;
  rating: number;
  voteCount: number;
  popularity: number;
};

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export default function FilmesPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchType, setSearchType] =
    useState<MediaType>("movie");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [popularTv, setPopularTv] = useState<MediaItem[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);

  const [selectedItem, setSelectedItem] =
    useState<MediaItem | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);

        if (!userProfile) {
          router.replace("/configurar");
          return;
        }

        setProfile(userProfile);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    async function loadPopular() {
      try {
        setPopularLoading(true);

        const response = await fetch(
          "/api/tmdb?action=popular"
        );

        if (!response.ok) {
          throw new Error(
            "Não foi possível carregar os populares."
          );
        }

        const data = await response.json();

        setPopularMovies(data.movies || []);
        setPopularTv(data.tv || []);
      } catch (error) {
        console.error(error);
      } finally {
        setPopularLoading(false);
      }
    }

    loadPopular();
  }, []);

  useEffect(() => {
    const term = searchTerm.trim();

    if (!term) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);

        const response = await fetch(
          `/api/tmdb?action=search&type=${searchType}&query=${encodeURIComponent(
            term
          )}`
        );

        if (!response.ok) {
          throw new Error(
            "Não foi possível realizar a busca."
          );
        }

        const data = await response.json();

        setSearchResults(data.results || []);
      } catch (error) {
        console.error(error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [searchTerm, searchType]);

  function clearSearch() {
    setSearchTerm("");
    setSearchResults([]);
  }

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
            onClick={() => router.push("/filmes")}
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
            onClick={() => router.push("/perfil")}
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

        {/* NAV */}

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-2">

          <NavButton
            active
            icon={<Film size={17} />}
            label="Filmes"
            onClick={() => router.push("/filmes")}
          />

          <NavButton
            icon={<BookOpen size={17} />}
            label="Biblioteca"
            onClick={() => router.push("/filmes/biblioteca")}
          />

          <NavButton
            icon={<Trophy size={17} />}
            label="Pódio"
            onClick={() => router.push("/filmes/podio")}
          />

          <NavButton
            icon={<UserRound size={17} />}
            label="Perfil"
            onClick={() => router.push("/perfil")}
          />

        </nav>

        {/* HERO */}

        <section className="mt-12">

          <div className="text-center">

            <p className="font-pixel text-xs text-pink-400">
              OLÁ, {profile.username.toUpperCase()}
            </p>

            <h1 className="mt-5 font-pixel text-2xl leading-relaxed text-white sm:text-4xl">
              O QUE VOCÊ QUER ASSISTIR?
            </h1>

            <p className="mx-auto mt-4 max-w-2xl font-retro text-2xl text-slate-400">
              Encontre um filme ou série e registre sua sessão.
            </p>

          </div>

          {/* SEARCH */}

          <div className="mx-auto mt-8 max-w-4xl">

            <div className="mb-3 flex justify-center gap-2">

              <SearchTypeButton
                active={searchType === "movie"}
                icon={<Film size={16} />}
                label="FILMES"
                onClick={() => {
                  setSearchType("movie");
                  setSearchResults([]);
                }}
              />

              <SearchTypeButton
                active={searchType === "tv"}
                icon={<Tv size={16} />}
                label="SÉRIES"
                onClick={() => {
                  setSearchType("tv");
                  setSearchResults([]);
                }}
              />

            </div>

            <div className="relative flex items-center gap-3 rounded-2xl border border-pink-400/30 bg-[#101522] px-5 py-5 shadow-[0_0_35px_rgba(255,0,127,0.1)]">

              <Search
                size={28}
                className="shrink-0 text-pink-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder={
                  searchType === "movie"
                    ? "Digite o nome de um filme..."
                    : "Digite o nome de uma série..."
                }
                className="w-full bg-transparent font-retro text-2xl text-white outline-none placeholder:text-slate-600"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="shrink-0 text-slate-500 transition hover:text-white"
                  aria-label="Limpar busca"
                >
                  <X size={22} />
                </button>
              )}

            </div>

          </div>

        </section>

        {/* SEARCH RESULTS */}

        {searchTerm.trim() && (
          <section className="mt-10">

            <SectionTitle
              title={
                searchType === "movie"
                  ? "RESULTADOS DE FILMES"
                  : "RESULTADOS DE SÉRIES"
              }
            />

            {searchLoading ? (
              <LoadingMessage />
            ) : searchResults.length === 0 ? (
              <EmptyMessage
                text={`Nenhum ${
                  searchType === "movie"
                    ? "filme"
                    : "série"
                } encontrado.`}
              />
            ) : (
              <MediaGrid
                items={searchResults}
                onSelect={setSelectedItem}
              />
            )}

          </section>
        )}

        {/* POPULAR MOVIES */}

        {!searchTerm.trim() && (
          <>
            <section className="mt-14">

              <SectionTitle title="FILMES POPULARES" />

              {popularLoading ? (
                <LoadingCarousel />
              ) : (
                <MediaCarousel
                  items={popularMovies}
                  onSelect={setSelectedItem}
                />
              )}

            </section>

            {/* POPULAR TV */}

            <section className="mt-14">

              <SectionTitle title="SÉRIES POPULARES" />

              {popularLoading ? (
                <LoadingCarousel />
              ) : (
                <MediaCarousel
                  items={popularTv}
                  onSelect={setSelectedItem}
                />
              )}

            </section>
          </>
        )}

      </div>

      {/* DETAIL MODAL */}

      {selectedItem && (
        <MediaModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

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

function SearchTypeButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-2 rounded-xl border px-4 py-2 font-pixel text-[9px] transition",
        active
          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
          : "border-white/10 bg-white/[0.03] text-slate-500 hover:text-white",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <div className="h-px flex-1 bg-white/10" />

      <h2 className="font-pixel text-xs text-cyan-300">
        {title}
      </h2>

      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function MediaCarousel({
  items,
  onSelect,
}: {
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
}) {
  if (!items.length) {
    return (
      <EmptyMessage text="Nenhum título disponível no momento." />
    );
  }

  return (
    <div className="flex gap-5 overflow-x-auto pb-5 [scrollbar-width:thin]">

      {items.map((item) => (
        <MediaCard
          key={`${item.type}-${item.id}`}
          item={item}
          onSelect={onSelect}
        />
      ))}

    </div>
  );
}

function MediaGrid({
  items,
  onSelect,
}: {
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((item) => (
        <MediaCard
          key={`${item.type}-${item.id}`}
          item={item}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function MediaCard({
  item,
  onSelect,
}: {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
}) {
  const poster = item.posterPath
    ? `${TMDB_IMAGE_BASE}${item.posterPath}`
    : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group w-[145px] shrink-0 text-left sm:w-[165px]"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#101522] shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition duration-300 group-hover:-translate-y-2 group-hover:border-pink-400/50 group-hover:shadow-[0_15px_35px_rgba(255,0,127,0.18)]">

        {poster ? (
          <img
            src={poster}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center font-retro text-xl text-slate-600">
            SEM CAPA
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-3 pt-12">

          <div className="flex items-center gap-1 text-yellow-300">
            <Star size={12} fill="currentColor" />
            <span className="font-pixel text-[9px]">
              {item.rating > 0
                ? item.rating.toFixed(1)
                : "--"}
            </span>
          </div>

        </div>

      </div>

      <div className="mt-3">

        <div className="line-clamp-2 font-retro text-xl leading-tight text-white">
          {item.title}
        </div>

        {item.year && (
          <div className="mt-1 font-retro text-base text-slate-500">
            {item.year}
          </div>
        )}

      </div>
    </button>
  );
}

function LoadingCarousel() {
  return (
    <div className="flex gap-5 overflow-hidden">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="h-[260px] w-[145px] shrink-0 animate-pulse rounded-2xl border border-white/5 bg-white/[0.04] sm:w-[165px]"
        />
      ))}
    </div>
  );
}

function LoadingMessage() {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02]">
      <p className="font-retro text-2xl text-cyan-300">
        PROCURANDO...
      </p>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02]">
      <p className="font-retro text-xl text-slate-600">
        {text}
      </p>
    </div>
  );
}

function MediaModal({
  item,
  onClose,
}: {
  item: MediaItem;
  onClose: () => void;
}) {
  const poster = item.posterPath
    ? `${TMDB_IMAGE_BASE}${item.posterPath}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f1c] shadow-[0_0_80px_rgba(0,0,0,0.8)]"
        onClick={(event) => event.stopPropagation()}
      >

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white transition hover:bg-pink-500/30"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="grid md:grid-cols-[220px_1fr]">

          <div className="bg-black/30 p-5 md:p-7">

            {poster ? (
              <img
                src={poster}
                alt={item.title}
                className="mx-auto w-full max-w-[220px] rounded-2xl object-cover shadow-2xl"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center rounded-2xl bg-white/[0.03] font-retro text-xl text-slate-600">
                SEM CAPA
              </div>
            )}

          </div>

          <div className="p-6 md:p-8">

            <div className="flex items-center gap-2 font-pixel text-[9px] text-pink-400">
              {item.type === "movie" ? (
                <>
                  <Film size={14} />
                  FILME
                </>
              ) : (
                <>
                  <Tv size={14} />
                  SÉRIE
                </>
              )}
            </div>

            <h2 className="mt-4 font-pixel text-xl leading-relaxed text-white sm:text-3xl">
              {item.title}
            </h2>

            {item.originalTitle &&
              item.originalTitle !== item.title && (
                <p className="mt-2 font-retro text-xl text-slate-500">
                  {item.originalTitle}
                </p>
              )}

            <div className="mt-4 flex flex-wrap items-center gap-4">

              {item.year && (
                <span className="font-retro text-xl text-slate-400">
                  {item.year}
                </span>
              )}

              <span className="flex items-center gap-1 font-retro text-xl text-yellow-300">
                <Star size={16} fill="currentColor" />
                {item.rating > 0
                  ? item.rating.toFixed(1)
                  : "--"}
              </span>

              <span className="font-retro text-lg text-slate-500">
                {item.voteCount.toLocaleString("pt-BR")} votos TMDB
              </span>

            </div>

            <div className="mt-7">

              <p className="font-pixel text-[9px] text-cyan-300">
                SINOPSE
              </p>

              <p className="mt-3 font-retro text-xl leading-relaxed text-slate-300">
                {item.overview}
              </p>

            </div>

            <div className="mt-8">

              <button
                type="button"
                className="rounded-2xl border border-pink-400/40 bg-pink-500/10 px-6 py-4 font-pixel text-[10px] text-pink-200 transition hover:border-pink-300 hover:bg-pink-500/20"
                onClick={() => {
                  alert(
                    "A tela de avaliação será conectada na próxima etapa."
                  );
                }}
              >
                AVALIAR ESTE TÍTULO
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
