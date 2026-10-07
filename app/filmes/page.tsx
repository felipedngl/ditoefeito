"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Search,
  Star,
  X,
} from "lucide-react";

import {
  addTitleToSpace,
  subscribeToMembers,
  subscribeToSpace,
  subscribeToSpaceRatings,
  subscribeToSpaceTitles,
  saveSpaceRating,
  type Space,
  type SpaceMember,
  type SpaceRating,
  type SpaceTitle,
} from "@/lib/spaces";

import {
  getUserProfile,
  subscribeToAuth,
  type UserProfile,
} from "@/lib/auth";

import {
  getSavedRating,
  saveRating,
  type SavedRating,
} from "@/lib/ratings";

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

const TMDB_IMAGE_BASE = 
  "https://image.tmdb.org/t/p/w500";

export default function FilmesPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);

  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [spaceMembers, setSpaceMembers] = useState<SpaceMember[]>([]);
  const [spaceTitles, setSpaceTitles] = useState<SpaceTitle[]>([]);
  const [spaceRatings, setSpaceRatings] = useState<
    Record<string, SpaceRating[]>
  >({});

  const [searchType, setSearchType] = useState<MediaType>("movie");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [popularTv, setPopularTv] = useState<MediaItem[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      if (!user) {
        setAuthUid(null);
        setProfile(null);
        return;
      }

      setAuthUid(user.uid);

      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedSpace = sessionStorage.getItem("ditoefeito_active_space");

    if (!storedSpace) return;

    try {
      const parsed = JSON.parse(storedSpace) as Space;
      setActiveSpace(parsed);
    } catch {
      sessionStorage.removeItem("ditoefeito_active_space");
    }
  }, []);

  useEffect(() => {
    if (!activeSpace) {
      setSpaceMembers([]);
      setSpaceTitles([]);
      setSpaceRatings({});
      return;
    }

    const unsubscribeSpace = subscribeToSpace(
      activeSpace.id,
      (space) => {
        setActiveSpace(space);

        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "ditoefeito_active_space",
            JSON.stringify(space)
          );
        }
      }
    );

    const unsubscribeMembers = subscribeToMembers(
      activeSpace.id,
      setSpaceMembers
    );

    const unsubscribeTitles = subscribeToSpaceTitles(
      activeSpace.id,
      setSpaceTitles
    );

    return () => {
      unsubscribeSpace();
      unsubscribeMembers();
      unsubscribeTitles();
    };
  }, [activeSpace?.id]);

  useEffect(() => {
    if (!activeSpace || spaceTitles.length === 0) {
      setSpaceRatings({});
      return;
    }

    const unsubscribers = spaceTitles.map((title) => {
      const key = `${title.mediaType}_${title.mediaId}`;

      return subscribeToSpaceRatings(
        activeSpace.id,
        title.mediaType,
        title.mediaId,
        (ratings) => {
          setSpaceRatings((current) => ({
            ...current,
            [key]: ratings,
          }));
        }
      );
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [activeSpace?.id, spaceTitles]);

  useEffect(() => {
    async function loadPopular() {
      try {
        setPopularLoading(true);

        const [moviesResponse, tvResponse] = await Promise.all([
          fetch("/api/tmdb?type=popular&mediaType=movie"),
          fetch("/api/tmdb?type=popular&mediaType=tv"),
        ]);

        const moviesData = await moviesResponse.json();
        const tvData = await tvResponse.json();

        if (moviesData.results) {
          setPopularMovies(moviesData.results);
        }

        if (tvData.results) {
          setPopularTv(tvData.results);
        }
      } catch (error) {
        console.error("Erro ao carregar catálogo:", error);
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
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setSearchLoading(true);

        const response = await fetch(
          `/api/tmdb?type=search&mediaType=${searchType}&query=${encodeURIComponent(
            term
          )}`
        );

        const data = await response.json();

        setSearchResults(data.results || []);
      } catch (error) {
        console.error("Erro na busca:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchTerm, searchType]);

  /*
   * Abre automaticamente títulos vindos de:
   *
   * /filmes?edit=movie_123
   *
   * ou
   *
   * /filmes?sessionTitle=movie_123
   *
   * Isso permite editar títulos pela Biblioteca e
   * abrir títulos diretamente pela Sala.
   */
  useEffect(() => {
    if (!authUid) return;

    const params = new URLSearchParams(window.location.search);

    const editKey = params.get("edit");
    const sessionKey = params.get("sessionTitle");

    if (!editKey && !sessionKey) return;

    let cancelled = false;

    async function openFromUrl() {
      try {
        if (editKey) {
          const separator = editKey.indexOf("_");

          if (separator <= 0) return;

          const type = editKey.slice(0, separator) as MediaType;
          const id = Number(editKey.slice(separator + 1));

          if (
            !["movie", "tv"].includes(type) ||
            !Number.isFinite(id)
          ) {
            return;
          }

          const saved = await getSavedRating(
            authUid!,
            type,
            id
          );

          if (!saved || cancelled) return;

          setSelectedItem({
            id: saved.mediaId,
            type: saved.mediaType,
            title: saved.title,
            originalTitle: saved.originalTitle,
            overview: saved.overview,
            posterPath: saved.posterPath,
            backdropPath: null,
            year: saved.year,
            rating: saved.tmdbRating,
            voteCount: saved.tmdbVoteCount,
            popularity: 0,
          });

          setRatingOpen(true);

          return;
        }

        if (sessionKey && spaceTitles.length > 0) {
          const title = spaceTitles.find(
            (item) =>
              `${item.mediaType}_${item.mediaId}` ===
              sessionKey
          );

          if (!title || cancelled) return;

          setSelectedItem({
            id: title.mediaId,
            type: title.mediaType,
            title: title.title,
            originalTitle: title.originalTitle,
            overview: title.overview,
            posterPath: title.posterPath,
            backdropPath: null,
            year: title.year,
            rating: title.tmdbRating,
            voteCount: title.tmdbVoteCount,
            popularity: 0,
          });

          setRatingOpen(true);
        }
      } catch (error) {
        console.error(
          "Não foi possível abrir o título:",
          error
        );
      }
    }

    openFromUrl();

    return () => {
      cancelled = true;
    };
  }, [authUid, spaceTitles]);

  function changeSearchType(type: MediaType) {
    setSearchType(type);
    setSearchResults([]);
  }

  function clearSearch() {
    setSearchTerm("");
    setSearchResults([]);
  }

  function openRating(item: MediaItem) {
    setSelectedItem(item);
    setRatingOpen(true);
  }

  function closeModal() {
    setSelectedItem(null);
    setRatingOpen(false);

    const params = new URLSearchParams(
      window.location.search
    );

    if (
      params.get("edit") ||
      params.get("sessionTitle")
    ) {
      router.replace("/filmes", {
        scroll: false,
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#070910] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070910]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="font-pixel text-sm text-pink-300 transition hover:text-white"
          >
            DITO & FEITO
          </button>

          <nav className="hidden items-center gap-6 md:flex">
            <button
              type="button"
              onClick={() => router.push("/filmes")}
              className="font-pixel text-[10px] text-cyan-300"
            >
              CATÁLOGO
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/filmes/biblioteca")
              }
              className="font-pixel text-[10px] text-slate-300 transition hover:text-white"
            >
              BIBLIOTECA
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/filmes/podio")
              }
              className="font-pixel text-[10px] text-slate-300 transition hover:text-white"
            >
              PÓDIO
            </button>

            <button
              type="button"
              onClick={() => router.push("/perfil")}
              className="font-pixel text-[10px] text-slate-300 transition hover:text-white"
            >
              PERFIL
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden text-right sm:block">
                <div className="font-retro text-sm text-white">
                  {profile.avatar} {profile.username}
                </div>

                <div className="font-pixel text-[8px] uppercase text-pink-300">
                  {profile.mode === "solo"
                    ? "SOZINHO"
                    : profile.mode === "couple"
                    ? "CASALZINHO"
                    : "GRUPINHO"}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-pink-400/40 hover:text-white"
            >
              <ArrowLeft size={15} />
              SAIR
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <p className="font-pixel text-[9px] uppercase tracking-[0.3em] text-pink-300">
            SEU CINEMA
          </p>

          <h1 className="mt-2 font-pixel text-2xl text-white md:text-4xl">
            CATÁLOGO
          </h1>

          <p className="mt-3 max-w-2xl font-retro text-base text-slate-400">
            Encontre filmes e séries, dê sua nota e monte sua
            própria história no cinema.
          </p>
        </div>

        {activeSpace &&
          profile?.mode !== "solo" &&
          spaceTitles.length > 0 && (
            <SharedSessionPanel
              titles={spaceTitles}
              ratings={spaceRatings}
              members={spaceMembers}
              currentUid={authUid || ""}
              onOpen={openRating}
            />
          )}

        <section className="mb-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder={
                    searchType === "movie"
                      ? "Buscar filme..."
                      : "Buscar série..."
                  }
                  className="w-full rounded-2xl border border-white/10 bg-[#0d111b] py-4 pl-12 pr-12 font-retro text-base text-white outline-none transition placeholder:text-slate-600 focus:border-pink-400/50"
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="relative">
                <select
                  value={searchType}
                  onChange={(event) =>
                    changeSearchType(
                      event.target.value as MediaType
                    )
                  }
                  className="h-full min-w-[150px] appearance-none rounded-2xl border border-white/10 bg-[#0d111b] px-5 py-4 pr-10 font-pixel text-[10px] text-white outline-none focus:border-cyan-400/50"
                >
                  <option value="movie">FILMES</option>
                  <option value="tv">SÉRIES</option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>

            {searchTerm && (
              <div className="mt-5">
                {searchLoading ? (
                  <div className="py-8 text-center font-retro text-slate-500">
                    Procurando...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-center font-retro text-slate-500">
                    Nenhum título encontrado.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {searchResults.map((item) => (
                      <MediaCard
                        key={`${item.type}_${item.id}`}
                        item={item}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {!searchTerm && (
          <>
            <CatalogSection
              title="FILMES EM ALTA"
              items={popularMovies}
              loading={popularLoading}
              onOpen={openRating}
            />

            <CatalogSection
              title="SÉRIES EM ALTA"
              items={popularTv}
              loading={popularLoading}
              onOpen={openRating}
            />
          </>
        )}
      </section>

      {selectedItem && !ratingOpen && (
        <MediaModal
          item={selectedItem}
          onClose={closeModal}
          onRate={() => setRatingOpen(true)}
        />
      )}

      {selectedItem && ratingOpen && authUid && (
        <RatingModal
          item={selectedItem}
          uid={authUid}
          activeSpace={activeSpace}
          onClose={closeModal}
          onSaved={closeModal}
        />
      )}
    </main>
  );
}

function CatalogSection({
  title,
  items,
  loading,
  onOpen,
}: {
  title: string;
  items: MediaItem[];
  loading: boolean;
  onOpen: (item: MediaItem) => void;
}) {
  return (
    <section className="mb-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="font-pixel text-[9px] text-cyan-300">
            DESCUBRA
          </p>

          <h2 className="mt-1 font-pixel text-lg text-white md:text-xl">
            {title}
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[2/3] animate-pulse rounded-2xl border border-white/5 bg-white/5"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <MediaCard
              key={`${item.type}_${item.id}`}
              item={item}
              onClick={() => onOpen(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MediaCard({
  item,
  onClick,
}: {
  item: MediaItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 text-left"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#101522]">
        {item.posterPath ? (
          <img
            src={`${TMDB_IMAGE_BASE}${item.posterPath}`}
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
            <Star size={11} fill="currentColor" />
            {item.rating?.toFixed(1) || "--"}
          </div>
        </div>
      </div>

      <div className="mt-2 line-clamp-2 font-retro text-sm text-white transition group-hover:text-pink-300">
        {item.title}
      </div>

      <div className="mt-1 font-pixel text-[8px] uppercase text-slate-500">
        {item.year || "—"}
      </div>
    </button>
  );
}

function MediaModal({
  item,
  onClose,
  onRate,
}: {
  item: MediaItem;
  onClose: () => void;
  onRate: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0d111b] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="relative">
          {item.backdropPath || item.posterPath ? (
            <img
              src={`${TMDB_IMAGE_BASE}${
                item.backdropPath || item.posterPath
              }`}
              alt={item.title}
              className="h-56 w-full object-cover"
            />
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/60 p-2 text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="font-pixel text-[9px] uppercase text-cyan-300">
            {item.type === "movie" ? "FILME" : "SÉRIE"}
          </div>

          <h2 className="mt-2 font-pixel text-xl text-white">
            {item.title}
          </h2>

          {item.year && (
            <div className="mt-2 font-retro text-sm text-slate-500">
              {item.year}
            </div>
          )}

          <div className="mt-5 flex items-center gap-2 font-retro text-base text-yellow-300">
            <Star size={18} fill="currentColor" />
            {item.rating?.toFixed(1) || "--"}
          </div>

          {item.overview && (
            <p className="mt-5 font-retro text-base leading-relaxed text-slate-300">
              {item.overview}
            </p>
          )}

          <button
            type="button"
            onClick={onRate}
            className="mt-7 w-full rounded-2xl bg-pink-500 px-5 py-4 font-pixel text-[10px] text-white transition hover:bg-pink-400"
          >
            AVALIAR ESTE TÍTULO
          </button>
        </div>
      </div>
    </div>
  );
}

function RatingModal({
  item,
  uid,
  activeSpace,
  onClose,
  onSaved,
}: {
  item: MediaItem;
  uid: string;
  activeSpace: Space | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadExisting() {
      try {
        setLoading(true);

        const existing = await getSavedRating(
          uid,
          item.type,
          item.id
        );

        if (cancelled) return;

        if (existing) {
          setRating(existing.rating);
          setReview(existing.review || "");
        } else {
          setRating(0);
          setReview("");
        }
      } catch (error) {
        console.error(
          "Erro ao carregar avaliação:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadExisting();

    return () => {
      cancelled = true;
    };
  }, [uid, item.id, item.type]);

  function selectRating(star: number) {
    if (rating === star) {
      setRating(star - 0.5);
    } else {
      setRating(star);
    }
  }

  async function handleSave() {
    if (rating <= 0) {
      setError("Escolha uma nota antes de salvar.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await saveRating(uid, {
        mediaId: item.id,
        mediaType: item.type,
        title: item.title,
        originalTitle: item.originalTitle,
        overview: item.overview,
        posterPath: item.posterPath,
        year: item.year,
        tmdbRating: item.rating,
        tmdbVoteCount: item.voteCount,
        rating,
        review: review.trim(),
      });

      if (activeSpace) {
        await addTitleToSpace(activeSpace.id, {
          mediaId: item.id,
          mediaType: item.type,
          title: item.title,
          originalTitle: item.originalTitle,
          overview: item.overview,
          posterPath: item.posterPath,
          year: item.year,
          tmdbRating: item.rating,
          tmdbVoteCount: item.voteCount,
          addedBy: uid,
        });

        await saveSpaceRating(
          activeSpace.id,
          item.type,
          item.id,
          {
            uid,
            value: rating,
            review: review.trim(),
          }
        );
      }

      onSaved();
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);

      setError(
        "Não foi possível salvar agora. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  const displayedRating = hoverRating || rating;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d111b] p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-pixel text-[9px] uppercase text-pink-300">
              SUA NOTA
            </div>

            <h2 className="mt-2 font-pixel text-lg text-white">
              {item.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center font-retro text-slate-500">
            Carregando sua avaliação...
          </div>
        ) : (
          <>
            <div className="mt-8">
              <div className="mb-3 font-pixel text-[9px] text-slate-400">
                DE 0,5 A 10
              </div>

              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 10 }).map(
                  (_, index) => {
                    const star = index + 1;
                    const isFull =
                      displayedRating >= star;
                    const isHalf =
                      displayedRating >= star - 0.5 &&
                      displayedRating < star;

                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => selectRating(star)}
                        onMouseEnter={() =>
                          setHoverRating(star)
                        }
                        onMouseLeave={() =>
                          setHoverRating(0)
                        }
                        className="relative p-1 text-yellow-300 transition hover:scale-110"
                        aria-label={`Nota ${star}`}
                      >
                        <Star
                          size={28}
                          fill={
                            isFull || isHalf
                              ? "currentColor"
                              : "transparent"
                          }
                          strokeWidth={1.5}
                        />

                        {isHalf && (
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-1/2 overflow-hidden">
                            <Star
                              size={28}
                              fill="currentColor"
                              strokeWidth={1.5}
                            />
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mt-3 font-pixel text-sm text-yellow-300">
                {displayedRating > 0
                  ? displayedRating.toFixed(1)
                  : "--"}
              </div>
            </div>

            <div className="mt-7">
              <label className="font-pixel text-[9px] text-slate-400">
                CRÍTICA / COMENTÁRIO
              </label>

              <textarea
                value={review}
                onChange={(event) =>
                  setReview(event.target.value)
                }
                placeholder="O que você achou?"
                rows={5}
                className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-[#080b12] p-4 font-retro text-base text-white outline-none placeholder:text-slate-600 focus:border-pink-400/50"
              />
            </div>

            {activeSpace && (
              <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 font-retro text-sm text-cyan-200">
                Esta nota também será registrada na sessão
                compartilhada.
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 font-retro text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-6 w-full rounded-2xl bg-pink-500 px-5 py-4 font-pixel text-[10px] text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "SALVANDO..." : "SALVAR NOTA"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SharedSessionPanel({
  titles,
  ratings,
  members,
  currentUid,
  onOpen,
}: {
  titles: SpaceTitle[];
  ratings: Record<string, SpaceRating[]>;
  members: SpaceMember[];
  currentUid: string;
  onOpen: (item: MediaItem) => void;
}) {
  const pending = titles.filter((title) => {
    const key = `${title.mediaType}_${title.mediaId}`;
    const titleRatings = ratings[key] || [];

    return !titleRatings.some(
      (rating) => rating.uid === currentUid
    );
  });

  if (pending.length === 0) {
    return (
      <section className="mb-10 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
        <div className="font-pixel text-[10px] text-emerald-300">
          SESSÃO EM DIA
        </div>

        <div className="mt-2 font-retro text-base text-slate-300">
          Todo mundo já deu sua nota nos títulos escolhidos.
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="mb-5">
        <p className="font-pixel text-[9px] text-pink-300">
          SESSÃO COMPARTILHADA
        </p>

        <h2 className="mt-1 font-pixel text-lg text-white">
          FALTA SUA NOTA
        </h2>

        <p className="mt-2 font-retro text-sm text-slate-400">
          Estes títulos estão esperando sua avaliação.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pending.map((title) => {
          const key = `${title.mediaType}_${title.mediaId}`;
          const titleRatings = ratings[key] || [];

          const voteCount = titleRatings.length;

          const average = voteCount
            ? titleRatings.reduce(
                (sum, rating) => sum + rating.rating,
                0
              ) / voteCount
            : 0;

          const item: MediaItem = {
            id: title.mediaId,
            type: title.mediaType,
            title: title.title,
            originalTitle: title.originalTitle,
            overview: title.overview,
            posterPath: title.posterPath,
            backdropPath: null,
            year: title.year,
            rating: title.tmdbRating,
            voteCount: title.tmdbVoteCount,
            popularity: 0,
          };

          return (
            <button
              key={key}
              type="button"
              onClick={() => onOpen(item)}
              className="flex gap-4 rounded-3xl border border-pink-400/20 bg-pink-400/5 p-4 text-left transition hover:border-pink-400/50 hover:bg-pink-400/10"
            >
              <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-black/30">
                {title.posterPath ? (
                  <img
                    src={`${TMDB_IMAGE_BASE}${title.posterPath}`}
                    alt={title.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-pixel text-[7px] text-slate-600">
                    SEM IMAGEM
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-pixel text-[8px] text-pink-300">
                  {title.mediaType === "movie"
                    ? "FILME"
                    : "SÉRIE"}
                </div>

                <div className="mt-2 line-clamp-2 font-retro text-base text-white">
                  {title.title}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 font-retro text-sm text-slate-400">
                  <span>
                    Média:{" "}
                    <strong className="text-yellow-300">
                      {voteCount
                        ? average.toFixed(2)
                        : "--"}
                    </strong>
                  </span>

                  <span>
                    Votos:{" "}
                    <strong className="text-white">
                      {voteCount}/{members.length}
                    </strong>
                  </span>
                </div>

                <div className="mt-3 font-pixel text-[9px] text-pink-300">
                  DAR MINHA NOTA →
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
