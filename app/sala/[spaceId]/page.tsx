"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ensureAnonymousUser,
  getUserProfile,
  type UserProfile,
} from "@/lib/auth";

import {
  acceptJoinRequest,
  rejectJoinRequest,
  requestToJoinSpace,
  subscribeToJoinRequests,
  subscribeToMembers,
  subscribeToSpace,
  subscribeToSpaceRatings,
  subscribeToSpaceTitles,
  type Space,
  type SpaceJoinRequest,
  type SpaceMember,
  type SpaceRating,
  type SpaceTitle,
} from "@/lib/spaces";

import {
  ArrowLeft,
  Check,
  Copy,
  Film,
  Share2,
  Star,
  Tv,
  UserCheck,
  UserX,
} from "lucide-react";

const TMDB_IMAGE_BASE =
  "https://image.tmdb.org/t/p/w500";

export default function SalaPage() {
  const router = useRouter();
  const params = useParams();

  const spaceId =
    String(params.spaceId);

  const [space, setSpace] =
    useState<Space | null>(null);

  const [members, setMembers] =
    useState<SpaceMember[]>([]);

  const [joinRequests, setJoinRequests] =
    useState<SpaceJoinRequest[]>([]);

  const [titles, setTitles] =
    useState<SpaceTitle[]>([]);

  const [ratings, setRatings] =
    useState<
      Record<string, SpaceRating[]>
    >({});

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [currentUid, setCurrentUid] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [requesting, setRequesting] =
    useState(false);

  const [processingRequest, setProcessingRequest] =
    useState("");

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [sharing, setSharing] =
    useState(false);

  /*
   * =====================================================
   * CARREGAR USUÁRIO + SALA EM TEMPO REAL
   * =====================================================
   */

  useEffect(() => {
    let mounted = true;

    const timeout =
      window.setTimeout(() => {
        if (!mounted) return;

        setLoading(false);

        setError(
          "A sala demorou demais para responder. Tente atualizar a página."
        );
      }, 12000);

    async function loadUser() {
      try {
        const user =
          await ensureAnonymousUser();

        if (!mounted) return;

        setCurrentUid(
          user.uid
        );

        const savedProfile =
          await getUserProfile(
            user.uid
          );

        if (!mounted) return;

        setProfile(
          savedProfile
        );
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError(
            "Não foi possível carregar seu perfil."
          );

          setLoading(false);
        }
      }
    }

    loadUser();

    const unsubscribeSpace =
      subscribeToSpace(
        spaceId,
        (nextSpace) => {
          if (!mounted) return;

          window.clearTimeout(
            timeout
          );

          if (!nextSpace) {
            setSpace(null);
            setLoading(false);

            setError(
              "Essa sala não existe ou foi encerrada."
            );

            return;
          }

          setSpace(
            nextSpace
          );

          setLoading(false);

          sessionStorage.setItem(
            "ditoefeito_space",
            JSON.stringify(
              nextSpace
            )
          );

          sessionStorage.setItem(
            "ditoefeito_active_space",
            JSON.stringify(
              nextSpace
            )
          );
        }
      );

    const unsubscribeMembers =
      subscribeToMembers(
        spaceId,
        (nextMembers) => {
          if (!mounted) return;

          setMembers(
            nextMembers
          );
        }
      );

    const unsubscribeRequests =
      subscribeToJoinRequests(
        spaceId,
        (requests) => {
          if (!mounted) return;

          setJoinRequests(
            requests
          );
        }
      );

    const unsubscribeTitles =
      subscribeToSpaceTitles(
        spaceId,
        (nextTitles) => {
          if (!mounted) return;

          setTitles(
            nextTitles
          );
        }
      );

    return () => {
      mounted = false;

      window.clearTimeout(
        timeout
      );

      unsubscribeSpace();
      unsubscribeMembers();
      unsubscribeRequests();
      unsubscribeTitles();
    };
  }, [spaceId]);

  /*
   * =====================================================
   * ESTADO DO USUÁRIO
   * =====================================================
   */

  const isMember =
    !!currentUid &&
    members.some(
      (member) =>
        member.uid ===
        currentUid
    );

  const isHost =
    !!space &&
    !!currentUid &&
    space.hostUid ===
      currentUid;

  const myJoinRequest =
    useMemo(
      () =>
        joinRequests.find(
          (request) =>
            request.uid ===
            currentUid
        ),
      [
        joinRequests,
        currentUid,
      ]
    );

  /*
   * =====================================================
   * SOLICITAR ENTRADA
   *
   * Isso serve principalmente para quem chegou ao lobby
   * por um código.
   * =====================================================
   */

  useEffect(() => {
    if (
      !space ||
      !profile ||
      !currentUid ||
      isMember ||
      isHost ||
      myJoinRequest
    ) {
      return;
    }

    let cancelled = false;

    async function requestEntry() {
      try {
        setRequesting(true);
        setError("");

        const result =
          await requestToJoinSpace({
            space,
            uid: currentUid,
            username:
              profile.username,
            avatar:
              profile.avatar,
          });

        if (cancelled) {
          return;
        }

        if (
          result === "full"
        ) {
          setError(
            "Esta sala já está cheia."
          );
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível solicitar entrada na sala."
          );
        }
      } finally {
        if (!cancelled) {
          setRequesting(
            false
          );
        }
      }
    }

    requestEntry();

    return () => {
      cancelled = true;
    };
  }, [
    space,
    profile,
    currentUid,
    isMember,
    isHost,
    myJoinRequest,
  ]);

  /*
   * =====================================================
   * QUANDO O HOST ACEITA
   *
   * O Firebase atualiza "members".
   *
   * O convidado detecta que virou membro e vai sozinho
   * para o catálogo.
   * =====================================================
   */

  useEffect(() => {
    if (
      !space ||
      !currentUid ||
      !isMember
    ) {
      return;
    }

    sessionStorage.setItem(
      "ditoefeito_space",
      JSON.stringify(space)
    );

    sessionStorage.setItem(
      "ditoefeito_active_space",
      JSON.stringify(space)
    );

    router.replace(
      "/filmes"
    );
  }, [
    space,
    currentUid,
    isMember,
    router,
  ]);

  /*
   * =====================================================
   * NOTAS DA SESSÃO
   * =====================================================
   */

  useEffect(() => {
    if (
      !space ||
      !titles.length ||
      !isMember
    ) {
      setRatings({});
      return;
    }

    const unsubscribers =
      titles.map(
        (title) => {
          const key =
            `${title.mediaType}_${title.mediaId}`;

          return subscribeToSpaceRatings(
            space.id,
            title.mediaType,
            title.mediaId,
            (nextRatings) => {
              setRatings(
                (current) => ({
                  ...current,
                  [key]:
                    nextRatings,
                })
              );
            }
          );
        }
      );

    return () => {
      unsubscribers.forEach(
        (unsubscribe) =>
          unsubscribe()
      );
    };
  }, [
    space?.id,
    titles,
    isMember,
  ]);

  /*
   * =====================================================
   * ESTATÍSTICAS
   * =====================================================
   */

  const titleStats =
    useMemo(() => {
      const result: Record<
        string,
        {
          votes: SpaceRating[];
          average: number;
          pending: SpaceMember[];
          currentUserVoted: boolean;
        }
      > = {};

      titles.forEach(
        (title) => {
          const key =
            `${title.mediaType}_${title.mediaId}`;

          const titleRatings =
            ratings[key] || [];

          const average =
            titleRatings.length
              ? titleRatings.reduce(
                  (
                    sum,
                    item
                  ) =>
                    sum +
                    item.rating,
                  0
                ) /
                titleRatings.length
              : 0;

          const pending =
            members.filter(
              (member) =>
                !titleRatings.some(
                  (rating) =>
                    rating.uid ===
                    member.uid
                )
            );

          result[key] = {
            votes:
              titleRatings,
            average,
            pending,
            currentUserVoted:
              !!currentUid &&
              titleRatings.some(
                (rating) =>
                  rating.uid ===
                  currentUid
              ),
          };
        }
      );

      return result;
    }, [
      titles,
      ratings,
      members,
      currentUid,
    ]);

  const pendingTitles =
    titles.filter(
      (title) => {
        const key =
          `${title.mediaType}_${title.mediaId}`;

        return !titleStats[key]
          ?.currentUserVoted;
      }
    );

  /*
   * =====================================================
   * CÓDIGO / COMPARTILHAR
   * =====================================================
   */

  const inviteUrl =
    typeof window !==
    "undefined"
      ? `${window.location.origin}/sala?code=${encodeURIComponent(
          space?.code || ""
        )}`
      : "";

  async function copyCode() {
    if (!space) return;

    try {
      await navigator.clipboard.writeText(
        space.code
      );

      setCopied(true);

      window.setTimeout(
        () =>
          setCopied(false),
        2000
      );
    } catch {
      setError(
        `Código da sala: ${space.code}`
      );
    }
  }

  async function shareInvite() {
    if (!space) return;

    try {
      setSharing(true);

      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            "Convite para o Dito & Feito",
          text:
            `Entre na sala "${space.name}" do Dito & Feito usando o código ${space.code}.`,
          url: inviteUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          inviteUrl
        );

        setCopied(true);

        window.setTimeout(
          () =>
            setCopied(false),
          2000
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSharing(false);
    }
  }

  /*
   * =====================================================
   * HOST ACEITA
   * =====================================================
   */

  async function handleAccept(
    request: SpaceJoinRequest
  ) {
    if (!space) return;

    try {
      setProcessingRequest(
        request.uid
      );

      setError("");

      await acceptJoinRequest({
        space,
        request,
      });

      /*
       * Assim que aceitar:
       * o host também vai para o catálogo.
       *
       * O convidado vai automaticamente através
       * do listener de members acima.
       */
      sessionStorage.setItem(
        "ditoefeito_space",
        JSON.stringify(space)
      );

      sessionStorage.setItem(
        "ditoefeito_active_space",
        JSON.stringify(space)
      );

      router.replace(
        "/filmes"
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível aceitar o participante."
      );
    } finally {
      setProcessingRequest(
        ""
      );
    }
  }

  /*
   * =====================================================
   * HOST RECUSA
   * =====================================================
   */

  async function handleReject(
    request: SpaceJoinRequest
  ) {
    try {
      setProcessingRequest(
        request.uid
      );

      setError("");

      await rejectJoinRequest(
        spaceId,
        request.uid
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir este pedido."
      );
    } finally {
      setProcessingRequest(
        ""
      );
    }
  }

  /*
   * =====================================================
   * CARREGANDO
   * =====================================================
   */

  if (loading) {
    return (
      <main className="retro-grid flex min-h-screen items-center justify-center px-5">
        <div className="text-center">
          <div className="font-pixel text-xs text-cyan-300">
            CARREGANDO SALA...
          </div>

          <div className="mt-4 font-retro text-lg text-slate-600">
            Conectando os participantes...
          </div>
        </div>
      </main>
    );
  }

  /*
   * =====================================================
   * SALA NÃO ENCONTRADA
   * =====================================================
   */

  if (!space) {
    return (
      <main className="retro-grid flex min-h-screen items-center justify-center px-5">
        <section className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-black/30 p-8 text-center">
          <div className="text-5xl">
            💥
          </div>

          <h1 className="mt-5 font-pixel text-sm text-white">
            SALA NÃO ENCONTRADA
          </h1>

          <p className="mt-4 text-slate-400">
            {error ||
              "Essa sala não está mais disponível."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="mt-8 rounded-xl bg-pink-500 px-6 py-4 font-pixel text-[10px] text-white"
          >
            VOLTAR AO INÍCIO
          </button>
        </section>
      </main>
    );
  }

  /*
   * =====================================================
   * CONVIDADO ESPERANDO
   * =====================================================
   */

  if (
    !isMember &&
    !isHost
  ) {
    const roomFull =
      members.length >=
      space.maxParticipants;

    return (
      <main className="retro-grid min-h-screen px-5 py-10">
        <div className="mx-auto w-full max-w-2xl">
          <header className="flex items-center justify-between border-b border-white/10 pb-6">
            <button
              type="button"
              onClick={() =>
                router.push("/")
              }
              className="font-pixel text-sm text-pink-300"
            >
              DITO & FEITO
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xl">
              {profile?.avatar ||
                "👤"}
            </div>
          </header>

          <section className="mt-12 rounded-3xl border border-pink-400/20 bg-black/30 p-8 text-center shadow-2xl backdrop-blur">

            <div className="text-6xl">
              {roomFull
                ? "🚫"
                : myJoinRequest
                  ? "⏳"
                  : "🎬"}
            </div>

            <div className="mt-6 font-pixel text-[10px] text-pink-400">
              {space.mode ===
              "group"
                ? "GRUPINHO"
                : "CASALZINHO"}
            </div>

            <h1 className="mt-3 font-pixel text-lg text-white sm:text-2xl">
              {space.name}
            </h1>

            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
              <div className="font-pixel text-[9px] text-cyan-300">
                CÓDIGO DA SALA
              </div>

              <div className="mt-2 font-pixel text-2xl tracking-[0.3em] text-white">
                {space.code}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="font-pixel text-[9px] text-slate-500">
                PARTICIPANTES
              </div>

              <div className="mt-2 font-pixel text-2xl text-white">
                {members.length}/
                {space.maxParticipants}
              </div>
            </div>

            {roomFull ? (
              <>
                <h2 className="mt-8 font-pixel text-sm text-red-300">
                  SALA CHEIA
                </h2>

                <p className="mx-auto mt-4 max-w-md font-retro text-xl text-slate-400">
                  Não há mais vagas
                  nesta sala.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-8 font-pixel text-sm text-cyan-300">
                  AGUARDANDO O ANFITRIÃO
                </h2>

                <p className="mx-auto mt-4 max-w-md font-retro text-xl leading-relaxed text-slate-400">
                  Seu perfil já chegou
                  ao lobby.
                  <br />
                  Quando o anfitrião
                  clicar em{" "}
                  <strong className="text-white">
                    ACEITAR
                  </strong>
                  , os dois irão
                  automaticamente para o
                  catálogo.
                </p>

                <div className="mt-7 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-3xl">
                      {profile?.avatar ||
                        "👤"}
                    </div>

                    <div className="text-left">
                      <div className="font-semibold text-white">
                        {profile?.username ||
                          "PARTICIPANTE"}
                      </div>

                      <div className="mt-1 text-xs text-cyan-300">
                        PEDIDO ENVIADO ✓
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                router.push("/")
              }
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-4 font-pixel text-[9px] text-slate-400 transition hover:border-white/20 hover:text-white"
            >
              <ArrowLeft
                size={15}
              />
              SAIR
            </button>
          </section>
        </div>
      </main>
    );
  }

  /*
   * =====================================================
   * HOST NO LOBBY
   * =====================================================
   *
   * IMPORTANTE:
   * O host fica aqui enquanto ninguém foi aceito.
   * Assim ele consegue ver os perfis que chegaram.
   */

  return (
    <main className="retro-grid min-h-screen px-5 pb-16">
      <div className="mx-auto w-full max-w-5xl">

        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-6">
          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="font-pixel text-sm text-pink-300"
          >
            DITO & FEITO
          </button>

          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {profile?.avatar ||
                "👤"}
            </div>

            <div className="text-right">
              <div className="font-pixel text-[9px] text-white">
                {profile?.username ||
                  "ANFITRIÃO"}
              </div>

              <div className="font-pixel text-[7px] text-pink-300">
                ANFITRIÃO
              </div>
            </div>
          </div>
        </header>

        <section className="mt-8 rounded-3xl border border-pink-400/20 bg-black/30 p-6 shadow-2xl backdrop-blur md:p-8">

          <div className="text-center">
            <div className="font-pixel text-[9px] text-pink-400">
              {space.mode ===
              "group"
                ? "👾 GRUPINHO"
                : "💞 CASALZINHO"}
            </div>

            <h1 className="mt-3 font-pixel text-xl text-white sm:text-3xl">
              {space.name}
            </h1>

            <p className="mt-3 font-retro text-xl text-slate-400">
              Convide as pessoas e
              aceite quem deve participar.
            </p>
          </div>

          {/* CÓDIGO */}

          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-cyan-400/30 bg-cyan-400/5 p-6 text-center">
            <div className="font-pixel text-[9px] text-cyan-300">
              CÓDIGO DA SALA
            </div>

            <div className="mt-3 font-pixel text-3xl tracking-[0.35em] text-white">
              {space.code}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={
                  copyCode
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-pixel text-[8px] text-white transition hover:border-cyan-400"
              >
                {copied ? (
                  <>
                    <Check
                      size={15}
                    />
                    COPIADO
                  </>
                ) : (
                  <>
                    <Copy
                      size={15}
                    />
                    COPIAR CÓDIGO
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={
                  shareInvite
                }
                disabled={
                  sharing
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-pink-400/30 bg-pink-500/10 px-4 py-3 font-pixel text-[8px] text-pink-300 transition hover:border-pink-300 hover:text-white"
              >
                <Share2
                  size={15}
                />
                CONVIDAR
              </button>
            </div>
          </div>

          {/* PARTICIPANTES ATUAIS */}

          <div className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <div className="font-pixel text-[9px] text-cyan-300">
                  PARTICIPANTES
                </div>

                <h2 className="mt-2 font-pixel text-sm text-white">
                  QUEM ESTÁ NA SALA
                </h2>
              </div>

              <div className="font-pixel text-[10px] text-slate-500">
                {members.length}/
                {space.maxParticipants}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {members.map(
                (member) => (
                  <div
                    key={
                      member.uid
                    }
                    className="rounded-2xl border border-pink-400/20 bg-pink-500/[0.04] p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-3xl">
                        {
                          member.avatar
                        }
                      </div>

                      <div>
                        <div className="font-retro text-2xl text-white">
                          {
                            member.username
                          }
                        </div>

                        <div className="mt-1 font-pixel text-[8px] text-pink-300">
                          ANFITRIÃO
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}

              {members.length ===
                1 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5">
                  <div className="flex h-full min-h-[88px] items-center justify-center text-center">
                    <div>
                      <div className="text-2xl">
                        ⏳
                      </div>

                      <div className="mt-2 font-pixel text-[8px] text-slate-500">
                        AGUARDANDO
                        CONVIDADO
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PEDIDOS */}

          <div className="mt-10">
            <div className="font-pixel text-[9px] text-cyan-300">
              ENTRADAS
            </div>

            <h2 className="mt-2 font-pixel text-sm text-white">
              QUEM QUER ENTRAR?
            </h2>

            {joinRequests.length ===
            0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                <div className="text-4xl">
                  🎟️
                </div>

                <p className="mt-4 font-retro text-lg text-slate-500">
                  Ainda ninguém
                  entrou com o código.
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Envie o código acima
                  para a pessoa que você
                  quer convidar.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {joinRequests.map(
                  (request) => (
                    <div
                      key={
                        request.uid
                      }
                      className="flex flex-col gap-4 rounded-2xl border border-cyan-400/30 bg-cyan-400/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-3xl">
                          {
                            request.avatar
                          }
                        </div>

                        <div>
                          <div className="font-retro text-2xl text-white">
                            {
                              request.username
                            }
                          </div>

                          <div className="mt-1 font-pixel text-[8px] text-cyan-300">
                            QUER ENTRAR NA SALA
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={
                            processingRequest ===
                            request.uid
                          }
                          onClick={() =>
                            handleReject(
                              request
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 font-pixel text-[8px] text-red-300 transition hover:border-red-300 hover:text-white disabled:opacity-50 sm:flex-none"
                        >
                          <UserX
                            size={15}
                          />
                          EXCLUIR
                        </button>

                        <button
                          type="button"
                          disabled={
                            processingRequest ===
                            request.uid
                          }
                          onClick={() =>
                            handleAccept(
                              request
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-pink-500 px-5 py-3 font-pixel text-[9px] text-white transition hover:bg-pink-400 disabled:opacity-50 sm:flex-none"
                        >
                          <UserCheck
                            size={15}
                          />
                          ACEITAR
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* INFORMAÇÃO */}

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
            <div className="font-pixel text-[9px] text-slate-500">
              COMO FUNCIONA
            </div>

            <p className="mt-3 font-retro text-lg leading-relaxed text-slate-400">
              Quando você clicar em{" "}
              <strong className="text-white">
                ACEITAR
              </strong>
              , seu convidado será
              liberado automaticamente.
              <br />
              Vocês dois serão levados ao
              catálogo ao mesmo tempo.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="mx-auto mt-8 flex items-center gap-2 font-retro text-lg text-slate-500 transition hover:text-white"
          >
            <ArrowLeft
              size={17}
            />
            Sair para o início
          </button>
        </section>
      </div>
    </main>
  );
}
