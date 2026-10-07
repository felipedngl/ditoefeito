"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import {
  ensureAnonymousUser,
  getUserProfile,
  type UserProfile,
} from "@/lib/auth";

import {
  joinSpace,
  startSpace,
  subscribeToMembers,
  subscribeToSpace,
  type Space,
  type SpaceMember,
} from "@/lib/spaces";

export default function SalaPage() {
  const router = useRouter();
  const params = useParams();

  const spaceId = String(params.spaceId);

  const [space, setSpace] =
    useState<Space | null>(null);

  const [members, setMembers] =
    useState<SpaceMember[]>([]);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [starting, setStarting] =
    useState(false);

  const [sharing, setSharing] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    const loadingTimeout =
      window.setTimeout(() => {
        if (!active) return;

        setLoading(false);
        setError(
          "A sala demorou demais para responder. Verifique sua conexão e tente novamente."
        );
      }, 12000);

    async function loadUser() {
      try {
        const user =
          await ensureAnonymousUser();

        const savedProfile =
          await getUserProfile(user.uid);

        if (active) {
          setProfile(savedProfile);
        }
      } catch (err) {
        console.error(err);

        if (active) {
          setError(
            "Não foi possível carregar seu perfil."
          );
        }
      }
    }

    loadUser();

    const unsubscribeSpace =
      subscribeToSpace(
        spaceId,
        (nextSpace) => {
          if (!active) return;

          window.clearTimeout(
            loadingTimeout
          );

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

          if (
            nextSpace.status ===
            "active"
          ) {
            router.push("/filmes");
          }
        }
      );

    const unsubscribeMembers =
      subscribeToMembers(
        spaceId,
        (nextMembers) => {
          if (!active) return;

          setMembers(nextMembers);
        }
      );

    return () => {
      active = false;

      window.clearTimeout(
        loadingTimeout
      );

      unsubscribeSpace();
      unsubscribeMembers();
    };
  }, [spaceId, router]);

  useEffect(() => {
    async function ensureMember() {
      if (!space || !profile) return;

      try {
        const user =
          await ensureAnonymousUser();

        await joinSpace({
          space,
          uid: user.uid,
          username:
            profile.username,
          avatar: profile.avatar,
        });
      } catch (err) {
        console.error(err);
      }
    }

    ensureMember();
  }, [space, profile]);

  async function handleStart() {
    if (!space || !profile) return;

    try {
      const user =
        await ensureAnonymousUser();

      if (user.uid !== space.hostUid) {
        return;
      }

      const minimum =
        space.mode === "couple"
          ? 2
          : 3;

      if (members.length < minimum) {
        setError(
          space.mode === "couple"
            ? "O casal precisa ter 2 participantes."
            : "O grupinho precisa ter pelo menos 3 participantes."
        );

        return;
      }

      setError("");
      setStarting(true);

      await startSpace(
        space.id
      );
    } catch (err) {
      console.error(err);

      setError(
        "Não foi possível iniciar a sala."
      );
    } finally {
      setStarting(false);
    }
  }

  function copyCode() {
    if (!space) return;

    navigator.clipboard
      ?.writeText(space.code)
      .then(() => {
        setError("Código copiado!");

        setTimeout(
          () => setError(""),
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

    const inviteUrl =
      `${window.location.origin}/sala?code=${encodeURIComponent(
        space.code
      )}`;

    try {
      setSharing(true);
      setError("");

      if (navigator.share) {
        await navigator.share({
          title:
            "Convite para o Dito & Feito",
          text:
            `Você foi convidado para a sala "${space.name}" no Dito & Feito.`,
          url: inviteUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          inviteUrl
        );

        setError(
          "Link do convite copiado!"
        );

        setTimeout(
          () => setError(""),
          2500
        );
      }
    } catch (err) {
      console.error(err);

      if (
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        (err as {
          name?: string;
        }).name === "AbortError"
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          inviteUrl
        );

        setError(
          "Link do convite copiado!"
        );

        setTimeout(
          () => setError(""),
          2500
        );
      } catch {
        setError(
          "Não foi possível compartilhar o convite."
        );
      }
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <main className="retro-grid flex min-h-screen items-center justify-center px-5">
        <div className="text-center">
          <div className="font-pixel text-xs text-cyan-300">
            CARREGANDO SALA...
          </div>

          <div className="mt-4 font-retro text-lg text-slate-600">
            Verificando conexão...
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
            VOLTAR
          </button>
        </section>
      </main>
    );
  }

  const isHost =
    !!profile &&
    profile &&
    members.some(
      (member) =>
        member.uid === space.hostUid
    );

  const minimum =
    space.mode === "couple"
      ? 2
      : 3;

  const readyToStart =
    members.length >= minimum;

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sala?code=${encodeURIComponent(
          space.code
        )}`
      : `/sala?code=${encodeURIComponent(
          space.code
        )}`;

  const qrUrl =
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
      inviteUrl
    )}`;

  return (
    <main className="retro-grid min-h-screen px-5 py-10">
      <div className="mx-auto max-w-4xl">

        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
          className="mb-8 font-pixel text-xs text-cyan-300 hover:text-white"
        >
          DITO & FEITO
        </button>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur md:p-10">

          <div className="text-center">

            <div className="font-pixel text-[10px] text-pink-400">
              {space.mode === "couple"
                ? "💞 CASALZINHO"
                : "👾 GRUPINHO"}
            </div>

            <h1 className="mt-4 font-pixel text-xl text-white md:text-2xl">
              {space.name}
            </h1>

            <p className="mt-3 text-lg text-slate-400">
              {space.mode === "couple"
                ? "Convide mais uma pessoa para começar."
                : "Convide a galera. Vocês precisam de pelo menos 3."}
            </p>

          </div>

          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6 text-center">

            <div className="font-pixel text-[9px] text-cyan-300">
              CÓDIGO DA SALA
            </div>

            <div className="mt-4 break-all font-pixel text-3xl tracking-[0.15em] text-white md:text-4xl">
              {space.code}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={copyCode}
                className="rounded-xl border border-cyan-400/30 px-4 py-3 text-sm text-cyan-300 transition hover:border-cyan-300 hover:text-white"
              >
                📋 COPIAR CÓDIGO
              </button>

              <button
                type="button"
                onClick={shareInvite}
                disabled={sharing}
                className="rounded-xl border border-pink-400/30 bg-pink-500/10 px-4 py-3 text-sm text-pink-300 transition hover:border-pink-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sharing
                  ? "ABRINDO..."
                  : "🔗 COMPARTILHAR CONVITE"}
              </button>

            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="rounded-2xl bg-white p-3">
              <img
                src={qrUrl}
                alt={`QR Code para entrar na sala ${space.code}`}
                width={220}
                height={220}
                className="h-[220px] w-[220px]"
              />
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Aponte a câmera do celular para entrar na sala.
          </p>

          <div className="mt-10">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-pixel text-xs text-white">
                  PARTICIPANTES
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {members.length}/
                  {space.maxParticipants}
                </p>
              </div>

              <div
                className={`rounded-full px-4 py-2 text-xs ${
                  readyToStart
                    ? "bg-green-500/10 text-green-300"
                    : "bg-yellow-500/10 text-yellow-300"
                }`}
              >
                {readyToStart
                  ? "PRONTO PARA COMEÇAR"
                  : `AGUARDANDO ${
                      Math.max(
                        minimum -
                          members.length,
                        0
                      )
                    }`}
              </div>

            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">

              {members.map(
                (member) => (
                  <div
                    key={member.uid}
                    className="rounded-2xl border border-white/10 bg-white/[.03] p-4"
                  >
                    <div className="flex items-center gap-3">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-3xl">
                        {member.avatar}
                      </div>

                      <div className="min-w-0">

                        <div className="truncate font-semibold text-white">
                          {member.username}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {member.role ===
                          "host"
                            ? "ANFITRIÃO"
                            : "PARTICIPANTE"}
                        </div>

                      </div>

                    </div>
                  </div>
                )
              )}

            </div>
          </div>

          {error && (
            <div
              className={`mt-6 rounded-xl px-4 py-3 text-center text-sm ${
                error ===
                  "Código copiado!" ||
                error ===
                  "Link do convite copiado!"
                  ? "border border-green-400/20 bg-green-500/10 text-green-300"
                  : "border border-red-400/20 bg-red-500/10 text-red-300"
              }`}
            >
              {error}
            </div>
          )}

          <div className="mt-10">

            {isHost ? (
              <button
                type="button"
                onClick={handleStart}
                disabled={
                  !readyToStart ||
                  starting
                }
                className="w-full rounded-xl bg-pink-500 px-5 py-5 font-pixel text-xs text-white shadow-[0_0_30px_rgba(255,0,127,.25)] transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {starting
                  ? "INICIANDO..."
                  : readyToStart
                    ? "COMEÇAR SESSÃO →"
                    : "AGUARDANDO PARTICIPANTES"}
              </button>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[.03] px-5 py-5 text-center">

                <div className="font-pixel text-[10px] text-cyan-300">
                  AGUARDANDO O ANFITRIÃO
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  Quando todos estiverem prontos, o anfitrião poderá começar a sessão.
                </p>

              </div>
            )}

          </div>

        </section>
      </div>
    </main>
  );
}
