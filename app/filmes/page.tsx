"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Search,
  Star,
  Trash2,
  Trophy,
  UserRound,
  Film,
  X,
} from "lucide-react";

import {
  addTitleToSpace,
  removeTitleFromSpace,
  saveSpaceRating,
  subscribeToMembers,
  subscribeToSpace,
  subscribeToSpaceRatings,
  subscribeToSpaceTitles,
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
  getPreferredUserSpace,
  getUserSpaces,
} from "@/lib/userSpaces";

import {
  getSavedRating,
  saveRating,
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

function titleToMediaItem(
  title: SpaceTitle
): MediaItem {
  return {
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
}

export default function FilmesPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [authUid, setAuthUid] =
    useState<string | null>(null);

  const [activeSpace, setActiveSpace] =
    useState<Space | null>(null);

  const [spaceMembers, setSpaceMembers] =
    useState<SpaceMember[]>([]);

  const [spaceTitles, setSpaceTitles] =
    useState<SpaceTitle[]>([]);

  const [spaceRatings, setSpaceRatings] =
    useState<Record<string, SpaceRating[]>>({});

  const [searchType, setSearchType] =
    useState<MediaType>("movie");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<MediaItem[]>([]);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [popularMovies, setPopularMovies] =
    useState<MediaItem[]>([]);

  const [popularTv, setPopularTv] =
    useState<MediaItem[]>([]);

  const [popularLoading, setPopularLoading] =
    useState(true);

  const [selectedItem, setSelectedItem] =
    useState<MediaItem | null>(null);

  const [ratingOpen, setRatingOpen] =
    useState(false);

  const [sessionOpen, setSessionOpen] =
    useState(false);

  const [addingTitleKey, setAddingTitleKey] =
    useState<string | null>(null);

  const [removeTarget, setRemoveTarget] =
    useState<SpaceTitle | null>(null);

  const [removingTitleKey, setRemovingTitleKey] =
    useState<string | null>(null);

  const [removeError, setRemoveError] =
    useState("");

  useEffect(() => {
    const unsubscribe =
      subscribeToAuth(async (user) => {
        if (!user) {
          setAuthUid(null);
          setProfile(null);
          return;
        }

        setAuthUid(user.uid);

        try {
          const userProfile =
            await getUserProfile(user.uid);

          setProfile(userProfile);
        } catch (error) {
          console.error(
            "Erro ao carregar perfil:",
            error
          );
        }
      });

    return unsubscribe;
  }, []);

  /*
   * Recupera a sala diretamente do Firestore.
   *
   * Não usamos sessionStorage nem localStorage.
   */
  useEffect(() => {
    if (!authUid) {
      setActiveSpace(null);
      return;
    }

    let cancelled = false;

    async function restoreUserSpace() {
      try {
        const spaces =
          await getUserSpaces(authUid);

        if (cancelled) {
          return;
        }

        const preferredSpace =
          getPreferredUserSpace(spaces);

        setActiveSpace(
          preferredSpace
        );
      } catch (error) {
        console.error(
          "Erro ao recuperar a sessão do usuário:",
          error
        );

        if (!cancelled) {
          setActiveSpace(null);
        }
      }
    }

    restoreUserSpace();

    return () => {
      cancelled = true;
    };
  }, [authUid]);

  /*
   * Mantém a sala em tempo real.
   */
  useEffect(() => {
    if (!activeSpace) {
      setSpaceMembers([]);
      setSpaceTitles([]);
      setSpaceRatings({});
      return;
    }

    const unsubscribeSpace =
      subscribeToSpace(
        activeSpace.id,
        (space) => {
          if (!space) {
            setActiveSpace(null);
            return;
          }

          setActiveSpace(space);
        }
      );

    const unsubscribeMembers =
      subscribeToMembers(
        activeSpace.id,
        setSpaceMembers
      );

    const unsubscribeTitles =
      subscribeToSpaceTitles(
        activeSpace.id,
        setSpaceTitles
      );

    return () => {
      unsubscribeSpace();
      unsubscribeMembers();
      unsubscribeTitles();
    };
  }, [activeSpace?.id]);

  /*
   * Observa as notas da sessão em tempo real.
   */
  useEffect(() => {
    if (
      !activeSpace ||
      spaceTitles.length === 0
    ) {
      setSpaceRatings({});
      return;
    }

    const unsubscribers =
      spaceTitles.map((title) => {
        const key =
          `${title.mediaType}_${title.mediaId}`;

        return subscribeToSpaceRatings(
          activeSpace.id,
          title.mediaType,
          title.mediaId,
          (ratings) => {
            setSpaceRatings(
              (current) => ({
                ...current,
                [key]: ratings,
              })
            );
          }
        );
      });

    return () => {
      unsubscribers.forEach(
        (unsubscribe) =>
          unsubscribe()
      );
    };
  }, [
    activeSpace?.id,
    spaceTitles,
  ]);

  /*
   * Carrega catálogo popular.
   */
  useEffect(() => {
    async function loadPopular() {
      try {
        setPopularLoading(true);

        const [
          moviesResponse,
          tvResponse,
        ] = await Promise.all([
          fetch(
            "/api/tmdb?type=popular&mediaType=movie"
          ),
          fetch(
            "/api/tmdb?type=popular&mediaType=tv"
          ),
        ]);

        const moviesData =
          await moviesResponse.json();

        const tvData =
          await tvResponse.json();

        if (moviesData.results) {
          setPopularMovies(
            moviesData.results
          );
        }

        if (tvData.results) {
          setPopularTv(
            tvData.results
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar catálogo:",
          error
        );
      } finally {
        setPopularLoading(false);
      }
    }

    loadPopular();
  }, []);

  /*
   * Busca de filmes/séries.
   */
  useEffect(() => {
    const term =
      searchTerm.trim();

    if (!term) {
      setSearchResults([]);
      return;
    }

    const timeout =
      window.setTimeout(
        async () => {
          try {
            setSearchLoading(true);

            const response =
              await fetch(
                `/api/tmdb?type=search&mediaType=${searchType}&query=${encodeURIComponent(
                  term
                )}`
              );

            const data =
              await response.json();

            setSearchResults(
              data.results || []
            );
          } catch (error) {
            console.error(
              "Erro na busca:",
              error
            );

            setSearchResults([]);
          } finally {
            setSearchLoading(false);
          }
        },
        350
      );

    return () =>
      window.clearTimeout(
        timeout
      );
  }, [
    searchTerm,
    searchType,
  ]);

  /*
   * Abre avaliações através de links
   * vindos da Biblioteca ou da sessão.
   */
  useEffect(() => {
    if (!authUid) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const editKey =
      params.get("edit");

    const sessionKey =
      params.get("sessionTitle");

    if (
      !editKey &&
      !sessionKey
    ) {
      return;
    }

    let cancelled = false;

    async function openFromUrl() {
      try {
        if (editKey) {
          const separator =
            editKey.indexOf("_");

          if (separator <= 0) {
            return;
          }

          const type =
            editKey.slice(
              0,
              separator
            ) as MediaType;

          const id =
            Number(
              editKey.slice(
                separator + 1
              )
            );

          if (
            !["movie", "tv"].includes(
              type
            ) ||
            !Number.isFinite(id)
          ) {
            return;
          }

          const saved =
            await getSavedRating(
              authUid,
              type,
              id
            );

          if (
            !saved ||
            cancelled
          ) {
            return;
          }

          setSelectedItem({
            id: saved.mediaId,
            type: saved.mediaType,
            title: saved.title,
            originalTitle:
              saved.originalTitle,
            overview:
              saved.overview,
            posterPath:
              saved.posterPath,
            backdropPath: null,
            year: saved.year,
            rating:
              saved.tmdbRating,
            voteCount:
              saved.tmdbVoteCount,
            popularity: 0,
          });

          setRatingOpen(true);
          return;
        }

        if (
          sessionKey &&
          spaceTitles.length > 0
        ) {
          const title =
            spaceTitles.find(
              (item) =>
                `${item.mediaType}_${item.mediaId}` ===
                sessionKey
            );

          if (
            !title ||
            cancelled
          ) {
            return;
          }

          setSelectedItem(
            titleToMediaItem(
              title
            )
          );

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
  }, [
    authUid,
    spaceTitles,
  ]);

  function changeSearchType(
    type: MediaType
  ) {
    setSearchType(type);
    setSearchResults([]);
  }

  function clearSearch() {
    setSearchTerm("");
    setSearchResults([]);
  }

  function openRating(
    item: MediaItem
  ) {
    setSelectedItem(item);
    setRatingOpen(true);
  }

  function openDetails(
    item: MediaItem
  ) {
    setSelectedItem(item);
    setRatingOpen(false);
  }

  function closeModal() {
    setSelectedItem(null);
    setRatingOpen(false);

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get("edit") ||
      params.get("sessionTitle")
    ) {
      router.replace(
        "/filmes",
        {
          scroll: false,
        }
      );
    }
  }

  async function addToSession(
    item: MediaItem
  ) {
    if (
      !activeSpace ||
      !authUid
    ) {
      return;
    }

    const key =
      `${item.type}_${item.id}`;

    if (
      addingTitleKey === key ||
      spaceTitles.some(
        (title) =>
          title.mediaType ===
            item.type &&
          title.mediaId ===
            item.id
      )
    ) {
      return;
    }

    try {
      setAddingTitleKey(key);

      await addTitleToSpace(
        activeSpace.id,
        {
          mediaId: item.id,
          mediaType: item.type,
          title: item.title,
          originalTitle:
            item.originalTitle,
          overview: item.overview,
          posterPath:
            item.posterPath,
          year: item.year,
          tmdbRating: item.rating,
          tmdbVoteCount:
            item.voteCount,
          addedBy: authUid,
        }
      );

      setSelectedItem(null);
      setRatingOpen(false);
      setSessionOpen(true);
    } catch (error) {
      console.error(
        "Erro ao adicionar título à sessão:",
        error
      );
    } finally {
      setAddingTitleKey(null);
    }
  }

  const isSharedMode =
    !!activeSpace &&
    profile?.mode !== "solo";

  async function handleRemoveFromSession() {
    if (
      !activeSpace ||
      !authUid ||
      !removeTarget
    ) {
      return;
    }

    const key =
      `${removeTarget.mediaType}_${removeTarget.mediaId}`;

    const isAllowed =
      removeTarget.addedBy ===
        authUid ||
      activeSpace.hostUid ===
        authUid;

    if (!isAllowed) {
      setRemoveError(
        "Somente quem adicionou o título ou o anfitrião pode removê-lo."
      );
      return;
    }

    try {
      setRemovingTitleKey(key);
      setRemoveError("");

      await removeTitleFromSpace(
        activeSpace.id,
        removeTarget.mediaType,
        removeTarget.mediaId
      );

      setRemoveTarget(null);
    } catch (error) {
      console.error(
        "Erro ao remover título da sessão:",
        error
      );

      setRemoveError(
        error instanceof Error
          ? error.message
          : "Não foi possível remover este título da sessão."
      );
    } finally {
      setRemovingTitleKey(null);
    }
  }

  const pendingCount =
    isSharedMode
      ? spaceTitles.filter(
          (title) => {
            const key =
              `${title.mediaType}_${title.mediaId}`;

            const titleRatings =
              spaceRatings[key] || [];

            return !titleRatings.some(
              (rating) =>
                rating.uid ===
                authUid
            );
          }
        ).length
      : 0;

  return (
    <main className="min-h-screen bg-[#070910] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070910]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <button
            type="button"
            onClick={() =>
              router.push("/filmes")
            }
            className="flex items-center gap-2"
            aria-label="Voltar para o catálogo"
          >
            <img
              src="/logo.png"
              alt="Dito & Feito"
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          </button>

          <nav className="hidden items-center gap-6 md:flex">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/filmes/biblioteca"
                )
              }
              className="font-pixel text-[10px] text-slate-300 transition hover:text-white"
            >
              BIBLIOTECA
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/filmes/podio"
                )
              }
              className="font-pixel text-[10px] text-slate-300 transition hover:text-white"
            >
              PÓDIO
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/perfil")
              }
              className="font-pixel text-[10px] text-slate-300 transition hover:text-white"
            >
              PERFIL
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden text-right sm:block">
                <div className="font-retro text-sm text-white">
                  {profile.avatar}{" "}
                  {profile.username}
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
              onClick={() =>
                router.push("/")
              }
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-pink-400/40 hover:text-white"
            >
              <ArrowLeft size={15} />
              SAIR
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <nav className="mb-5 flex gap-2 overflow-x-auto">
          <CatalogNavButton
            icon={<Film size={16} />}
            label="CATÁLOGO"
            active
            onClick={() =>
              router.push("/filmes")
            }
          />

          <CatalogNavButton
            icon={<BookOpen size={16} />}
            label="BIBLIOTECA"
            onClick={() =>
              router.push(
                "/filmes/biblioteca"
              )
            }
          />

          <CatalogNavButton
            icon={<Trophy size={16} />}
            label="PÓDIO"
            onClick={() =>
              router.push(
                "/filmes/podio"
              )
            }
          />

          <CatalogNavButton
            icon={<UserRound size={16} />}
            label="PERFIL"
            onClick={() =>
              router.push("/perfil")
            }
          />
        </nav>

        <div className="mb-8">
          <p className="font-pixel text-[9px] uppercase tracking-[0.3em] text-pink-300">
            SEU CINEMA
          </p>

          <h1 className="mt-2 font-pixel text-2xl text-white md:text-4xl">
            CATÁLOGO
          </h1>

          <p className="mt-3 max-w-2xl font-retro text-base text-slate-400">
            Encontre filmes e séries,
            dê sua nota e monte sua
            própria história no cinema.
          </p>
        </div>

        {isSharedMode && (
          <section className="mb-8">
            <button
              type="button"
              onClick={() =>
                setSessionOpen(true)
              }
              className="w-full rounded-3xl border border-pink-400/30 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-400/10 p-5 text-left transition hover:border-pink-400/60"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-pixel text-[9px] text-pink-300">
                    SESSÃO ATIVA
                  </div>

                  <div className="mt-2 font-pixel text-sm text-white md:text-base">
                    {activeSpace?.name ||
                      "SALA"}{" "}
                    · {spaceMembers.length}{" "}
                    {spaceMembers.length === 1
                      ? "PESSOA"
                      : "PESSOAS"}{" "}
                    · {spaceTitles.length}{" "}
                    {spaceTitles.length === 1
                      ? "TÍTULO"
                      : "TÍTULOS"}
                  </div>

                  <div className="mt-2 font-retro text-sm text-slate-400">
                    {pendingCount > 0
                      ? `${pendingCount} título${
                          pendingCount === 1
                            ? ""
                            : "s"
                        } aguardando sua nota`
                      : "Você está em dia com a sessão"}
                  </div>
                </div>

                <div className="shrink-0 rounded-2xl border border-pink-400/30 bg-pink-500/10 px-5 py-3 text-center font-pixel text-[9px] text-pink-200">
                  ABRIR SESSÃO →
                </div>
              </div>
            </button>
          </section>
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
                    setSearchTerm(
                      event.target.value
                    )
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
                  <option value="movie">
                    FILMES
                  </option>
                  <option value="tv">
                    SÉRIES
                  </option>
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
                  <div className="grid gap-3">
                    {searchResults.map(
                      (item) => (
                        <MediaSearchResult
                          key={`${item.type}_${item.id}`}
                          item={item}
                          onOpen={() =>
                            openDetails(item)
                          }
                          onRate={() =>
                            openRating(item)
                          }
                          onAddToSession={
                            isSharedMode
                              ? () =>
                                  addToSession(item)
                              : undefined
                          }
                          adding={
                            addingTitleKey ===
                            `${item.type}_${item.id}`
                          }
                          alreadyAdded={spaceTitles.some(
                            (title) =>
                              title.mediaType ===
                                item.type &&
                              title.mediaId ===
                                item.id
                          )}
                        />
                      )
                    )}
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
              onOpen={openDetails}
            />

            <CatalogSection
              title="SÉRIES EM ALTA"
              items={popularTv}
              loading={popularLoading}
              onOpen={openDetails}
            />
          </>
        )}
      </section>

      {selectedItem && !ratingOpen && (
        <MediaModal
          item={selectedItem}
          onClose={closeModal}
          onRate={() =>
            setRatingOpen(true)
          }
          onAddToSession={
            isSharedMode
              ? () =>
                  addToSession(selectedItem)
              : undefined
          }
          alreadyInSession={
            !!activeSpace &&
            spaceTitles.some(
              (title) =>
                title.mediaType ===
                  selectedItem.type &&
                title.mediaId ===
                  selectedItem.id
            )
          }
          adding={
            addingTitleKey ===
            `${selectedItem.type}_${selectedItem.id}`
          }
        />
      )}

      {selectedItem &&
        ratingOpen &&
        authUid && (
          <RatingModal
            item={selectedItem}
            uid={authUid}
            activeSpace={activeSpace}
            onClose={closeModal}
            onSaved={closeModal}
          />
        )}

      {sessionOpen && activeSpace && (
        <SharedSessionModal
          space={activeSpace}
          titles={spaceTitles}
          ratings={spaceRatings}
          members={spaceMembers}
          currentUid={authUid || ""}
          onClose={() =>
            setSessionOpen(false)
          }
          onOpenTitle={(title) => {
            setSessionOpen(false);
            setSelectedItem(
              titleToMediaItem(title)
            );
            setRatingOpen(true);
          }}
          onRequestRemove={(title) => {
            setRemoveError("");
            setRemoveTarget(title);
          }}
        />
      )}

      {removeTarget && activeSpace && (
        <RemoveSessionTitleModal
          title={removeTarget}
          removing={!!removingTitleKey}
          error={removeError}
          onClose={() => {
            if (!removingTitleKey) {
              setRemoveTarget(null);
              setRemoveError("");
            }
          }}
          onConfirm={
            handleRemoveFromSession
          }
        />
      )}
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Search,
  Star,
  Trash2,
  Trophy,
  UserRound,
  Film,
  X,
} from "lucide-react";

import {
  addTitleToSpace,
  removeTitleFromSpace,
  saveSpaceRating,
  subscribeToMembers,
  subscribeToSpace,
  subscribeToSpaceRatings,
  subscribeToSpaceTitles,
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
  getPreferredUserSpace,
  getUserSpaces,
} from "@/lib/userSpaces";

import {
  getSavedRating,
  saveRating,
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

function titleToMediaItem(
  title: SpaceTitle
): MediaItem {
  return {
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
}

export default function FilmesPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [authUid, setAuthUid] =
    useState<string | null>(null);

  const [activeSpace, setActiveSpace] =
    useState<Space | null>(null);

  const [spaceMembers, setSpaceMembers] =
    useState<SpaceMember[]>([]);

  const [spaceTitles, setSpaceTitles] =
    useState<SpaceTitle[]>([]);

  const [spaceRatings, setSpaceRatings] =
    useState<Record<string, SpaceRating[]>>({});

  const [searchType, setSearchType] =
    useState<MediaType>("movie");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<MediaItem[]>([]);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [popularMovies, setPopularMovies] =
    useState<MediaItem[]>([]);

  const [popularTv, setPopularTv] =
    useState<MediaItem[]>([]);

  const [popularLoading, setPopularLoading] =
    useState(true);

  const [selectedItem, setSelectedItem] =
    useState<MediaItem | null>(null);

  const [ratingOpen, setRatingOpen] =
    useState(false);

  const [sessionOpen, setSessionOpen] =
    useState(false);

  const [addingTitleKey, setAddingTitleKey] =
    useState<string | null>(null);

  const [removeTarget, setRemoveTarget] =
    useState<SpaceTitle | null>(null);

  const [removingTitleKey, setRemovingTitleKey] =
    useState<string | null>(null);

  const [removeError, setRemoveError] =
    useState("");

  useEffect(() => {
    const unsubscribe =
      subscribeToAuth(async (user) => {
        if (!user) {
          setAuthUid(null);
          setProfile(null);
          return;
        }

        setAuthUid(user.uid);

        try {
          const userProfile =
            await getUserProfile(user.uid);

          setProfile(userProfile);
        } catch (error) {
          console.error(
            "Erro ao carregar perfil:",
            error
          );
        }
      });

    return unsubscribe;
  }, []);

  /*
   * Recupera a sala diretamente do Firestore.
   *
   * Não usamos sessionStorage nem localStorage.
   */
  useEffect(() => {
    if (!authUid) {
      setActiveSpace(null);
      return;
    }

    let cancelled = false;

    async function restoreUserSpace() {
      try {
        const spaces =
          await getUserSpaces(authUid);

        if (cancelled) {
          return;
        }

        const preferredSpace =
          getPreferredUserSpace(spaces);

        setActiveSpace(
          preferredSpace
        );
      } catch (error) {
        console.error(
          "Erro ao recuperar a sessão do usuário:",
          error
        );

        if (!cancelled) {
          setActiveSpace(null);
        }
      }
    }

    restoreUserSpace();

    return () => {
      cancelled = true;
    };
  }, [authUid]);

  /*
   * Mantém a sala em tempo real.
   */
  useEffect(() => {
    if (!activeSpace) {
      setSpaceMembers([]);
      setSpaceTitles([]);
      setSpaceRatings({});
      return;
    }

    const unsubscribeSpace =
      subscribeToSpace(
        activeSpace.id,
        (space) => {
          if (!space) {
            setActiveSpace(null);
            return;
          }

          setActiveSpace(space);
        }
      );

    const unsubscribeMembers =
      subscribeToMembers(
        activeSpace.id,
        setSpaceMembers
      );

    const unsubscribeTitles =
      subscribeToSpaceTitles(
        activeSpace.id,
        setSpaceTitles
      );

    return () => {
      unsubscribeSpace();
      unsubscribeMembers();
      unsubscribeTitles();
    };
  }, [activeSpace?.id]);

  /*
   * Observa as notas da sessão em tempo real.
   */
  useEffect(() => {
    if (
      !activeSpace ||
      spaceTitles.length === 0
    ) {
      setSpaceRatings({});
      return;
    }

    const unsubscribers =
      spaceTitles.map((title) => {
        const key =
          `${title.mediaType}_${title.mediaId}`;

        return subscribeToSpaceRatings(
          activeSpace.id,
          title.mediaType,
          title.mediaId,
          (ratings) => {
            setSpaceRatings(
              (current) => ({
                ...current,
                [key]: ratings,
              })
            );
          }
        );
      });

    return () => {
      unsubscribers.forEach(
        (unsubscribe) =>
          unsubscribe()
      );
    };
  }, [
    activeSpace?.id,
    spaceTitles,
  ]);

  /*
   * Carrega catálogo popular.
   */
  useEffect(() => {
    async function loadPopular() {
      try {
        setPopularLoading(true);

        const [
          moviesResponse,
          tvResponse,
        ] = await Promise.all([
          fetch(
            "/api/tmdb?type=popular&mediaType=movie"
          ),
          fetch(
            "/api/tmdb?type=popular&mediaType=tv"
          ),
        ]);

        const moviesData =
          await moviesResponse.json();

        const tvData =
          await tvResponse.json();

        if (moviesData.results) {
          setPopularMovies(
            moviesData.results
          );
        }

        if (tvData.results) {
          setPopularTv(
            tvData.results
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar catálogo:",
          error
        );
      } finally {
        setPopularLoading(false);
      }
    }

    loadPopular();
  }, []);

  /*
   * Busca de filmes/séries.
   */
  useEffect(() => {
    const term =
      searchTerm.trim();

    if (!term) {
      setSearchResults([]);
      return;
    }

    const timeout =
      window.setTimeout(
        async () => {
          try {
            setSearchLoading(true);

            const response =
              await fetch(
                `/api/tmdb?type=search&mediaType=${searchType}&query=${encodeURIComponent(
                  term
                )}`
              );

            const data =
              await response.json();

            setSearchResults(
              data.results || []
            );
          } catch (error) {
            console.error(
              "Erro na busca:",
              error
            );

            setSearchResults([]);
          } finally {
            setSearchLoading(false);
          }
        },
        350
      );

    return () =>
      window.clearTimeout(
        timeout
      );
  }, [
    searchTerm,
    searchType,
  ]);

  /*
   * Abre avaliações através de links
   * vindos da Biblioteca ou da sessão.
   */
  useEffect(() => {
    if (!authUid) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const editKey =
      params.get("edit");

    const sessionKey =
      params.get("sessionTitle");

    if (
      !editKey &&
      !sessionKey
    ) {
      return;
    }

    let cancelled = false;

    async function openFromUrl() {
      try {
        if (editKey) {
          const separator =
            editKey.indexOf("_");

          if (separator <= 0) {
            return;
          }

          const type =
            editKey.slice(
              0,
              separator
            ) as MediaType;

          const id =
            Number(
              editKey.slice(
                separator + 1
              )
            );

          if (
            !["movie", "tv"].includes(
              type
            ) ||
            !Number.isFinite(id)
          ) {
            return;
          }

          const saved =
            await getSavedRating(
              authUid,
              type,
              id
            );

          if (
            !saved ||
            cancelled
          ) {
            return;
          }

          setSelectedItem({
            id: saved.mediaId,
            type: saved.mediaType,
            title: saved.title,
            originalTitle:
              saved.originalTitle,
            overview:
              saved.overview,
            posterPath:
              saved.posterPath,
            backdropPath: null,
            year: saved.year,
            rating:
              saved.tmdbRating,
            voteCount:
              saved.tmdbVoteCount,
            popularity: 0,
          });

          setRatingOpen(true);
          return;
        }

        if (
          sessionKey &&
          spaceTitles.length > 0
        ) {
          const title =
            spaceTitles.find(
              (item) =>
                `${item.mediaType}_${item.mediaId}` ===
                sessionKey
            );

          if (
            !title ||
            cancelled
          ) {
            return;
          }

          setSelectedItem(
            titleToMediaItem(
              title
            )
          );

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
  }, [
    authUid,
    spaceTitles,
  ]);

  function changeSearchType(
    type: MediaType
  ) {
    setSearchType(type);
    setSearchResults([]);
  }

  function clearSearch() {
    setSearchTerm("");
    setSearchResults([]);
  }

  function openRating(
    item: MediaItem
  ) {
    setSelectedItem(item);
    setRatingOpen(true);
  }

  function openDetails(
    item: MediaItem
  ) {
    setSelectedItem(item);
    setRatingOpen(false);
  }

  function closeModal() {
    setSelectedItem(null);
    setRatingOpen(false);

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get("edit") ||
      params.get("sessionTitle")
    ) {
      router.replace(
        "/filmes",
        {
          scroll: false,
        }
      );
    }
  }

  async function addToSession(
    item: MediaItem
  ) {
    if (
      !activeSpace ||
      !authUid
    ) {
      return;
    }

    const key =
      `${item.type}_${item.id}`;

    if (
      addingTitleKey === key ||
      spaceTitles.some(
        (title) =>
          title.mediaType ===
            item.type &&
          title.mediaId ===
            item.id
      )
    ) {
      return;
    }

    try {
      setAddingTitleKey(key);

      await addTitleToSpace(
        activeSpace.id,
        {
          mediaId: item.id,
          mediaType: item.type,
          title: item.title,
          originalTitle:
            item.originalTitle,
          overview: item.overview,
          posterPath:
            item.posterPath,
          year: item.year,
          tmdbRating: item.rating,
          tmdbVoteCount:
            item.voteCount,
          addedBy: authUid,
        }
      );

      setSelectedItem(null);
      setRatingOpen(false);
      setSessionOpen(true);
    } catch (error) {
      console.error(
        "Erro ao adicionar título à sessão:",
        error
      );
    } finally {
      setAddingTitleKey(null);
    }
  }

  const isSharedMode =
    !!activeSpace &&
    profile?.mode !== "solo";

  async function handleRemoveFromSession() {
    if (
      !activeSpace ||
      !authUid ||
      !removeTarget
    ) {
      return;
    }

    const key =
      `${removeTarget.mediaType}_${removeTarget.mediaId}`;

    const isAllowed =
      removeTarget.addedBy ===
        authUid ||
      activeSpace.hostUid ===
        authUid;

    if (!isAllowed) {
      setRemoveError(
        "Somente quem adicionou o título ou o anfitrião pode removê-lo."
      );
      return;
    }

    try {
      setRemovingTitleKey(key);
      setRemoveError("");

      await removeTitleFromSpace(
        activeSpace.id,
        removeTarget.mediaType,
        removeTarget.mediaId
      );

      setRemoveTarget(null);
    } catch (error) {
      console.error(
        "Erro ao remover título da sessão:",
        error
      );

      setRemoveError(
        error instanceof Error
          ? error.message
          : "Não foi possível remover este título da sessão."
      );
    } finally {
      setRemovingTitleKey(null);
    }
  }

  const pendingCount =
    isSharedMode
      ? spaceTitles.filter(
          (title) => {
            const key =
              `${title.mediaType}_${title.mediaId}`;

            const titleRatings =
              spaceRatings[key] || [];

            return !titleRatings.some(
              (rating) =>
                rating.uid ===
                authUid
            );
          }
        ).length
      : 0;

  return (
    <main className="min-h-screen bg-[#070910] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070910]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <button
            type="button"
            onClick={() =>
              router.push("/filmes")
            }
            className="flex items-center gap-2"
            aria-label="Voltar para o catálogo"
          >
            <img
              src="/logo.png"
              alt="Dito & Feito"
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          </button>

          <nav className="hidden items-center gap-6 md:flex">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/filmes/biblioteca"
                )
              }
              className="font-pixel text-[10px] text-slate-300 transition hover:text-white"
            >
              BIBLIOTECA
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/filmes/podio"
                )
              }
              className="font-pixel text-[10px] text-slate-300 transition hover:text-white"
            >
              PÓDIO
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/perfil")
              }
              className="font-pixel text-[10px] text-slate-300 transition hover:text-white"
            >
              PERFIL
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden text-right sm:block">
                <div className="font-retro text-sm text-white">
                  {profile.avatar}{" "}
                  {profile.username}
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
              onClick={() =>
                router.push("/")
              }
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-pink-400/40 hover:text-white"
            >
              <ArrowLeft size={15} />
              SAIR
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <nav className="mb-5 flex gap-2 overflow-x-auto">
          <CatalogNavButton
            icon={<Film size={16} />}
            label="CATÁLOGO"
            active
            onClick={() =>
              router.push("/filmes")
            }
          />

          <CatalogNavButton
            icon={<BookOpen size={16} />}
            label="BIBLIOTECA"
            onClick={() =>
              router.push(
                "/filmes/biblioteca"
              )
            }
          />

          <CatalogNavButton
            icon={<Trophy size={16} />}
            label="PÓDIO"
            onClick={() =>
              router.push(
                "/filmes/podio"
              )
            }
          />

          <CatalogNavButton
            icon={<UserRound size={16} />}
            label="PERFIL"
            onClick={() =>
              router.push("/perfil")
            }
          />
        </nav>

        <div className="mb-8">
          <p className="font-pixel text-[9px] uppercase tracking-[0.3em] text-pink-300">
            SEU CINEMA
          </p>

          <h1 className="mt-2 font-pixel text-2xl text-white md:text-4xl">
            CATÁLOGO
          </h1>

          <p className="mt-3 max-w-2xl font-retro text-base text-slate-400">
            Encontre filmes e séries,
            dê sua nota e monte sua
            própria história no cinema.
          </p>
        </div>

        {isSharedMode && (
          <section className="mb-8">
            <button
              type="button"
              onClick={() =>
                setSessionOpen(true)
              }
              className="w-full rounded-3xl border border-pink-400/30 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-400/10 p-5 text-left transition hover:border-pink-400/60"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-pixel text-[9px] text-pink-300">
                    SESSÃO ATIVA
                  </div>

                  <div className="mt-2 font-pixel text-sm text-white md:text-base">
                    {activeSpace?.name ||
                      "SALA"}{" "}
                    · {spaceMembers.length}{" "}
                    {spaceMembers.length === 1
                      ? "PESSOA"
                      : "PESSOAS"}{" "}
                    · {spaceTitles.length}{" "}
                    {spaceTitles.length === 1
                      ? "TÍTULO"
                      : "TÍTULOS"}
                  </div>

                  <div className="mt-2 font-retro text-sm text-slate-400">
                    {pendingCount > 0
                      ? `${pendingCount} título${
                          pendingCount === 1
                            ? ""
                            : "s"
                        } aguardando sua nota`
                      : "Você está em dia com a sessão"}
                  </div>
                </div>

                <div className="shrink-0 rounded-2xl border border-pink-400/30 bg-pink-500/10 px-5 py-3 text-center font-pixel text-[9px] text-pink-200">
                  ABRIR SESSÃO →
                </div>
              </div>
            </button>
          </section>
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
                    setSearchTerm(
                      event.target.value
                    )
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
                  <option value="movie">
                    FILMES
                  </option>
                  <option value="tv">
                    SÉRIES
                  </option>
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
                  <div className="grid gap-3">
                    {searchResults.map(
                      (item) => (
                        <MediaSearchResult
                          key={`${item.type}_${item.id}`}
                          item={item}
                          onOpen={() =>
                            openDetails(item)
                          }
                          onRate={() =>
                            openRating(item)
                          }
                          onAddToSession={
                            isSharedMode
                              ? () =>
                                  addToSession(item)
                              : undefined
                          }
                          adding={
                            addingTitleKey ===
                            `${item.type}_${item.id}`
                          }
                          alreadyAdded={spaceTitles.some(
                            (title) =>
                              title.mediaType ===
                                item.type &&
                              title.mediaId ===
                                item.id
                          )}
                        />
                      )
                    )}
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
              onOpen={openDetails}
            />

            <CatalogSection
              title="SÉRIES EM ALTA"
              items={popularTv}
              loading={popularLoading}
              onOpen={openDetails}
            />
          </>
        )}
      </section>

      {selectedItem && !ratingOpen && (
        <MediaModal
          item={selectedItem}
          onClose={closeModal}
          onRate={() =>
            setRatingOpen(true)
          }
          onAddToSession={
            isSharedMode
              ? () =>
                  addToSession(selectedItem)
              : undefined
          }
          alreadyInSession={
            !!activeSpace &&
            spaceTitles.some(
              (title) =>
                title.mediaType ===
                  selectedItem.type &&
                title.mediaId ===
                  selectedItem.id
            )
          }
          adding={
            addingTitleKey ===
            `${selectedItem.type}_${selectedItem.id}`
          }
        />
      )}

      {selectedItem &&
        ratingOpen &&
        authUid && (
          <RatingModal
            item={selectedItem}
            uid={authUid}
            activeSpace={activeSpace}
            onClose={closeModal}
            onSaved={closeModal}
          />
        )}

      {sessionOpen && activeSpace && (
        <SharedSessionModal
          space={activeSpace}
          titles={spaceTitles}
          ratings={spaceRatings}
          members={spaceMembers}
          currentUid={authUid || ""}
          onClose={() =>
            setSessionOpen(false)
          }
          onOpenTitle={(title) => {
            setSessionOpen(false);
            setSelectedItem(
              titleToMediaItem(title)
            );
            setRatingOpen(true);
          }}
          onRequestRemove={(title) => {
            setRemoveError("");
            setRemoveTarget(title);
          }}
        />
      )}

      {removeTarget && activeSpace && (
        <RemoveSessionTitleModal
          title={removeTarget}
          removing={!!removingTitleKey}
          error={removeError}
          onClose={() => {
            if (!removingTitleKey) {
              setRemoveTarget(null);
              setRemoveError("");
            }
          }}
          onConfirm={
            handleRemoveFromSession
          }
        />
      )}
    </main>
  );
}
