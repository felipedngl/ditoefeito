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
  ExternalLink,
  Film,
  RefreshCw,
  Share2,
  Star,
  Tv,
  UserCheck,
  UserX,
} from "lucide-react";

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

  const [requestError, setRequestError] =
    useState("");

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [sharing, setSharing] =
    useState(false);

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

        setCurrentUid(user.uid);

        const savedProfile =
          await getUserProfile(
            user.uid
          );

        if (!mounted) return;

        setProfile(savedProfile);
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

          window.clearTimeout(timeout);

          if (!nextSpace) {
            setSpace(null);
            setLoading(false);

            setError(
              "Essa sala não existe ou foi encerrada."
            );

            return;
          }

          setSpace(nextSpace);
          setLoading(false);

          sessionStorage.setItem(
            "ditoefeito_space",
            JSON.stringify(nextSpace)
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

  const isMember = useMemo(
    () =>
      !!currentUid &&
      members.some(
        (member) =>
          member.uid === currentUid
      ),
    [members, currentUid]
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
        setRequestError("");

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

        if (result === "full") {
          setRequestError(
            "Esta sala já está cheia."
          );

          return;
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setRequestError(
            err instanceof Error
              ? err.message
              : "Não foi possível solicitar entrada na sala."
          );
        }
      } finally {
        if (!cancelled) {
          setRequesting(false);
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
      titles.map((title) => {
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
      });

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

  const participantCount =
    members.length;

  const totalExpected =
    space?.maxParticipants || 0;

  const titleStats = useMemo(() => {
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

  const myPendingTitles =
    titles.filter(
      (title) => {
        const key =
          `${title.mediaType}_${title.mediaId}`;

        return !titleStats[key]
          ?.currentUserVoted;
      }
    );

  const allTitlesComplete =
    titles.length > 0 &&
    titles.every(
      (title) => {
        const key =
          `${title.mediaType}_${title.mediaId}`;

        const stats =
          titleStats[key];

        return (
          stats &&
          stats.votes.length >=
            participantCount
        );
      }
    );

  const inviteUrl =
    typeof window !==
    "undefined"
      ? `${window.location.origin}/sala?code=${encodeURIComponent(
          space?.code || ""
        )}`
      : "";

  function copyCode() {
    if (!space) return;

    navigator.clipboard
      ?.writeText(space.code)
      .then(() => {
        setCopied(true);

        window.setTimeout(
          () =>
            setCopied(false),
          2000
        );
      })
      .catch(() => {
        setError(
          `Código da sala: ${space.code}`
        );
      });
  }

  async function shareInvite() {
    if (!space) return;

    try {
      setSharing(true);
      setError("");

      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            "Convite para o Dito & Feito",
          text:
            `Entre na sala "${space.name}" do Dito & Feito.`,
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

      if (
        typeof err ===
          "object" &&
        err !== null &&
        "name" in err &&
        (
          err as {
            name?: string;
          }
        ).name ===
          "AbortError"
      ) {
        return;
      }
    } finally {
      setSharing(false);
    }
  }

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
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível aceitar o participante."
      );
    } finally {
      setProcessingRequest("");
    }
  }

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
          : "Não foi possível recusar o participante."
      );
    } finally {
      setProcessingRequest("");
    }
  }

  function openCatalog() {
    if (!isMember) return;

    if (
      space &&
      !isHost
    ) {
      return;
    }

    router.push("/filmes");
  }

  function openSessionWindow() {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    window.open(
      window.location.origin +
        "/sala/" +
        spaceId,
      "ditoefeito-sessao",
      "popup=yes,width=520,height=820"
    );
  }

  function openTitle(
    title: SpaceTitle
  ) {
    const key =
      `${title.mediaType}_${title.mediaId}`;

    router.push(
      `/filmes?sessionTitle=${encodeURIComponent(
        key
      )}`
    );
  }

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
   * ======================================================
   * CONVIDADO AGUARDANDO ACEITE
   * ======================================================
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
              className="flex items-center gap-3"
            >
              <img
                src="/logo.png"
                alt="Dito & Feito"
                className="h-10 w-auto max-w-[180px] object-contain"
              />
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
                ? "💞"
                : "🎟️"}
            </div>

            <div className="mt-6 font-pixel text-[10px] text-pink-400">
              CASALZINHO
            </div>

            <h1 className="mt-3 font-pixel text-lg text-white sm:text-2xl">
              {space.name}
            </h1>

            <div className="mx-auto mt-5 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5">
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
                  Esta sala de casal já possui os dois participantes.
                </p>
              </>
            ) : myJoinRequest ||
              requesting ? (
              <>
                <h2 className="mt-8 font-pixel text-sm text-cyan-300">
                  AGUARDANDO O ANFITRIÃO
                </h2>

                <p className="mx-auto mt-4 max-w-md font-retro text-xl text-slate-400">
                  Seu pedido foi enviado. Assim que o anfitrião aceitar, você entrará automaticamente na sala.
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
            ) : (
              <>
                <h2 className="mt-8 font-pixel text-sm text-white">
                  ENTRANDO NA SALA...
                </h2>

                <p className="mx-auto mt-4 max-w-md font-retro text-xl text-slate-400">
                  Estamos verificando se ainda existe uma vaga.
                </p>
              </>
            )}

            {requestError && (
              <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {requestError}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                router.push("/")
              }
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-4 font-pixel text-[9px] text-slate-400 transition hover:border-white/20 hover:text-white"
            >
              <ArrowLeft size={15} />
              SAIR
            </button>
          </section>
        </div>
      </main>
    );
  }

  /*
   * ======================================================
   * SALA DO HOST / PARTICIPANTES
   * ======================================================
   */

  return (
    <main className="retro-grid min-h-screen px-5 pb-16">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-6">
          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
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
            onClick={() =>
              router.push(
                "/perfil"
              )
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xl">
              {profile?.avatar ||
                "👤"}
            </div>

            <div className="hidden text-left sm:block">
              <div className="font-pixel text-[9px] text-white">
                {profile?.username ||
                  "PARTICIPANTE"}
              </div>

              <div className="font-retro text-base text-slate-500">
                {isHost
                  ? "ANFITRIÃO"
                  : "PARTICIPANTE"}
              </div>
            </div>
          </button>
        </header>

        <section className="mt-8 rounded-3xl border border-pink-400/20 bg-black/30 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="font-pixel text-[9px] text-pink-400">
                💞 CASALZINHO
              </div>

              <h1 className="mt-3 font-pixel text-xl text-white sm:text-3xl">
                {space.name}
              </h1>

              <p className="mt-3 font-retro text-xl text-slate-400">
                {participantCount ===
                2
                  ? "VOCÊS DOIS ESTÃO CONECTADOS."
                  : "AGUARDANDO SEU PAR."}
              </p>

              <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-pink-400/20 bg-pink-500/5 px-5 py-3">
                <span className="font-pixel text-[9px] text-slate-500">
                  SALA
                </span>

                <span className="font-pixel text-sm text-white">
                  {participantCount}/2
                </span>

                <span className="text-xs text-slate-500">
                  PARTICIPANTES
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyCode}
                className="flex items-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-3 text-sm text-cyan-300 transition hover:border-cyan-300 hover:text-white"
              >
                {copied ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}

                {copied
                  ? "COPIADO"
                  : space.code}
              </button>

              <button
                type="button"
                onClick={
                  openSessionWindow
                }
                className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-300 transition hover:border-cyan-300 hover:text-white"
              >
                <ExternalLink size={16} />
                ABRIR SESSÃO
              </button>

              {isHost && (
                <button
                  type="button"
                  onClick={
                    shareInvite
                  }
                  disabled={sharing}
                  className="flex items-center gap-2 rounded-xl border border-pink-400/30 bg-pink-500/10 px-4 py-3 text-sm text-pink-300 transition hover:border-pink-300 hover:text-white disabled:opacity-50"
                >
                  <Share2
                    size={16}
                  />

                  {sharing
                    ? "ABRINDO..."
                    : "CONVIDAR"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatusCard
              label="PARTICIPANTES"
              value={`${participantCount}/2`}
              detail={
                participantCount ===
                2
                  ? "sala completa"
                  : "aguardando seu par"
              }
            />

            <StatusCard
              label="TÍTULOS"
              value={`${titles.length}`}
              detail="na sessão"
            />

            <StatusCard
              label="PENDÊNCIAS"
              value={`${myPendingTitles.length}`}
              detail="para você"
            />
          </div>
        </section>

        {isHost &&
          joinRequests.length >
            0 && (
            <section className="mt-8 rounded-3xl border border-cyan-400/30 bg-cyan-400/[0.04] p-6 shadow-xl md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-pixel text-[9px] text-cyan-300">
                    NOVO PEDIDO
                  </div>

                  <h2 className="mt-2 font-pixel text-sm text-white">
                    ALGUÉM QUER ENTRAR
                  </h2>

                  <p className="mt-2 font-retro text-lg text-slate-500">
                    Aceite seu par para começar a sessão.
                  </p>
                </div>

                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 font-pixel text-[9px] text-cyan-300">
                  {participantCount}/2
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {joinRequests.map(
                  (request) => (
                    <div
                      key={
                        request.uid
                      }
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
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

                          <div className="mt-1 text-xs text-cyan-300">
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
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs text-red-300 transition hover:border-red-300 hover:text-white disabled:opacity-50 sm:flex-none"
                        >
                          <UserX
                            size={15}
                          />
                          RECUSAR
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
            </section>
          )}

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-pixel text-[9px] text-cyan-300">
                PARTICIPANTES
              </p>

              <h2 className="mt-2 font-pixel text-sm text-white">
                VOCÊS NA SESSÃO
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="flex items-center gap-2 self-start rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400 transition hover:border-white/20 hover:text-white"
            >
              <RefreshCw
                size={15}
              />
              ATUALIZAR
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {members.map(
              (member) => (
                <div
                  key={
                    member.uid
                  }
                  className={`rounded-2xl border p-5 ${
                    member.role ===
                    "host"
                      ? "border-pink-400/20 bg-pink-500/[0.04]"
                      : "border-cyan-400/20 bg-cyan-400/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5 text-3xl">
                      {
                        member.avatar
                      }
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-retro text-2xl text-white">
                        {
                          member.username
                        }
                      </div>

                      <div
                        className={`mt-1 font-pixel text-[8px] ${
                          member.role ===
                          "host"
                            ? "text-pink-300"
                            : "text-cyan-300"
                        }`}
                      >
                        {member.role ===
                        "host"
                          ? "ANFITRIÃO"
                          : "SEU PAR"}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section className="mt-10">
          <div>
            <p className="font-pixel text-[9px] text-pink-400">
              FILMES E SÉRIES DA SESSÃO
            </p>

            <h2 className="mt-2 font-pixel text-sm text-white">
              TÍTULOS PARA VOCÊS AVALIAREM
            </h2>

            <p className="mt-3 font-retro text-xl text-slate-500">
              Cada título precisa receber uma nota de cada participante.
            </p>
          </div>

          {!titles.length ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
              <div className="text-5xl">
                🎬
              </div>

              <h3 className="mt-5 font-pixel text-xs text-white">
                NENHUM TÍTULO AINDA
              </h3>

              <p className="mx-auto mt-3 max-w-lg font-retro text-xl text-slate-500">
                {isHost
                  ? "Como anfitrião, vá ao catálogo e escolha os filmes ou séries da sessão."
                  : "O anfitrião ainda não escolheu nenhum filme ou série."}
              </p>

              {isHost && (
                <button
                  type="button"
                  onClick={
                    openCatalog
                  }
                  className="mt-6 rounded-xl bg-pink-500 px-6 py-4 font-pixel text-[9px] text-white transition hover:bg-pink-400"
                >
                  IR PARA O CATÁLOGO →
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {titles.map(
                (title) => {
                  const key =
                    `${title.mediaType}_${title.mediaId}`;

                  const stats =
                    titleStats[
                      key
                    ];

                  const titleRatings =
                    stats?.votes ||
                    [];

                  const voteCount =
                    titleRatings.length;

                  const average =
                    stats?.average ||
                    0;

                  return (
                    <div
                      key={key}
                      className={`rounded-3xl border p-4 transition sm:p-5 ${
                        stats?.currentUserVoted
                          ? "border-white/10 bg-white/[0.025]"
                          : "border-pink-400/30 bg-pink-500/[0.04]"
                      }`}
                    >
                      <div className="flex flex-col gap-5 md:flex-row">
                        <div className="h-36 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#101522]">
                          {title.posterPath ? (
                            <img
                              src={`${TMDB_IMAGE_BASE}${title.posterPath}`}
                              alt={
                                title.title
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-center text-xs text-slate-600">
                              SEM CAPA
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                              {title.mediaType ===
                              "movie" ? (
                                <Film
                                  size={
                                    12
                                  }
                                />
                              ) : (
                                <Tv
                                  size={
                                    12
                                  }
                                />
                              )}

                              {title.mediaType ===
                              "movie"
                                ? "FILME"
                                : "SÉRIE"}
                            </span>

                            {title.year && (
                              <span className="text-xs text-slate-500">
                                {
                                  title.year
                                }
                              </span>
                            )}
                          </div>

                          <h3 className="mt-3 font-retro text-2xl text-white">
                            {
                              title.title
                            }
                          </h3>

                          <div className="mt-4 flex flex-wrap items-center gap-4">
                            <div>
                              <div className="font-pixel text-[8px] text-slate-500">
                                MÉDIA ATUAL
                              </div>

                              <div className="mt-1 flex items-center gap-2 font-retro text-xl text-yellow-300">
                                <Star
                                  size={
                                    16
                                  }
                                  fill="currentColor"
                                />

                                {voteCount
                                  ? average.toFixed(
                                      2
                                    )
                                  : "--"}
                              </div>
                            </div>

                            <div>
                              <div className="font-pixel text-[8px] text-slate-500">
                                VOTOS
                              </div>

                              <div className="mt-1 font-retro text-xl text-white">
                                {voteCount}/
                                {totalExpected}
                              </div>
                            </div>

                            <div>
                              <div className="font-pixel text-[8px] text-slate-500">
                                SITUAÇÃO
                              </div>

                              <div
                                className={`mt-1 font-pixel text-[9px] ${
                                  stats?.currentUserVoted
                                    ? "text-green-300"
                                    : "text-pink-300"
                                }`}
                              >
                                {stats?.currentUserVoted
                                  ? "SUA NOTA ✓"
                                  : "FALTA SUA NOTA"}
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            {members.map(
                              (
                                member
                              ) => {
                                const memberRating =
                                  titleRatings.find(
                                    (
                                      rating
                                    ) =>
                                      rating.uid ===
                                      member.uid
                                  );

                                return (
                                  <div
                                    key={
                                      member.uid
                                    }
                                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                                  >
                                    <div className="text-xs text-slate-500">
                                      {
                                        member.username
                                      }
                                    </div>

                                    <div
                                      className={`mt-1 text-sm ${
                                        memberRating
                                          ? "text-yellow-300"
                                          : "text-slate-600"
                                      }`}
                                    >
                                      {memberRating
                                        ? memberRating.rating.toFixed(
                                            1
                                          )
                                        : "—"}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>

                          <div className="mt-5">
                            <button
                              type="button"
                              onClick={() =>
                                openTitle(
                                  title
                                )
                              }
                              className={`flex items-center gap-2 rounded-xl px-5 py-3 font-pixel text-[9px] transition ${
                                stats?.currentUserVoted
                                  ? "border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                                  : "bg-pink-500 text-white hover:bg-pink-400"
                              }`}
                            >
                              {stats?.currentUserVoted
                                ? "VER NO CATÁLOGO"
                                : "DAR MINHA NOTA →"}

                              <ExternalLink
                                size={
                                  14
                                }
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {error && (
          <div className="mt-8 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="flex items-center gap-2 font-retro text-lg text-slate-500 transition hover:text-white"
          >
            <ArrowLeft
              size={17}
            />
            Sair para o início
          </button>
        </div>
      </div>
    </main>
  );
}

function StatusCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="font-pixel text-[8px] text-slate-500">
        {label}
      </div>

      <div className="mt-2 font-pixel text-sm text-white">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-600">
        {detail}
      </div>
    </div>
  );
}

const TMDB_IMAGE_BASE =
  "https://image.tmdb.org/t/p/w500";
