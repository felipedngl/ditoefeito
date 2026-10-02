"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dices,
  Heart,
  Users,
  UserRound,
} from "lucide-react";

type ModeId = "solo" | "couple" | "group";

const animals = [
  "🐱",
  "🐶",
  "🦊",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐸",
  "🐵",
  "🐰",
  "🐻",
  "🐺",
  "🦄",
  "🐙",
  "🦋",
  "🐝",
  "🦉",
  "🦩",
  "🐢",
  "🐳",
];

const modeInfo: Record<
  ModeId,
  {
    title: string;
    description: string;
    icon: typeof UserRound;
    color: "pink" | "cyan" | "purple";
  }
> = {
  solo: {
    title: "SOZINHO",
    description: "Seu espaço pessoal para organizar tudo o que você assiste.",
    icon: UserRound,
    color: "pink",
  },
  couple: {
    title: "CASALZINHO",
    description: "Um espaço para duas pessoas compartilharem suas opiniões.",
    icon: Heart,
    color: "cyan",
  },
  group: {
    title: "GRUPINHO",
    description: "Sua galera reunida para avaliar e descobrir favoritos.",
    icon: Users,
    color: "purple",
  },
};

function getRandomAnimal() {
  return animals[Math.floor(Math.random() * animals.length)];
}

function ConfigurarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modeParam = searchParams.get("modo");

  const mode: ModeId =
    modeParam === "couple" || modeParam === "group"
      ? modeParam
      : "solo";

  const info = modeInfo[mode];
  const Icon = info.icon;

  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(() => getRandomAnimal());
  const [spaceName, setSpaceName] = useState("");

  const canContinue =
    username.trim().length >= 3 &&
    (mode === "solo" || spaceName.trim().length >= 2);

  const usernamePreview = useMemo(() => {
    return username.trim()
      ? username
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
      : "seu_usuario";
  }, [username]);

  function randomizeAvatar() {
    let next = getRandomAnimal();

    while (next === avatar) {
      next = getRandomAnimal();
    }

    setAvatar(next);
  }

  function handleContinue() {
    if (!canContinue) return;

    const profileData = {
      username: username.trim(),
      usernameSlug: usernamePreview,
      avatar,
      mode,
      spaceName: mode === "solo" ? "" : spaceName.trim(),
    };

    sessionStorage.setItem(
      "dito-feito-profile-draft",
      JSON.stringify(profileData)
    );

    router.push("/filmes");
  }

  return (
    <main className="retro-grid min-h-screen overflow-hidden">
      <div className="relative z-10 min-h-screen">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center px-6 py-5">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="mx-auto font-pixel text-[9px] tracking-widest text-white sm:text-[10px]">
              DITO <span className="text-pink-400">&</span> FEITO
            </div>

            <div className="w-16" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-6 pb-20 pt-14 sm:pt-20">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center border ${
                  info.color === "pink"
                    ? "border-pink-400/40 bg-pink-500/10"
                    : info.color === "cyan"
                      ? "border-cyan-400/40 bg-cyan-400/10"
                      : "border-purple-400/40 bg-purple-400/10"
                }`}
              >
                <Icon
                  className={`h-7 w-7 ${
                    info.color === "pink"
                      ? "text-pink-300"
                      : info.color === "cyan"
                        ? "text-cyan-300"
                        : "text-purple-300"
                  }`}
                />
              </div>

              <p className="mt-8 font-pixel text-[9px] uppercase tracking-[0.25em] text-white/35">
                Vamos preparar seu espaço
              </p>

              <h1
                className={`mt-5 font-pixel text-xl ${
                  info.color === "pink"
                    ? "text-pink-300"
                    : info.color === "cyan"
                      ? "text-cyan-300"
                      : "text-purple-300"
                } sm:text-2xl`}
              >
                {info.title}
              </h1>

              <p className="mx-auto mt-5 max-w-lg font-retro text-2xl leading-relaxed text-white/55">
                {info.description}
              </p>
            </div>

            <div className="mt-14 space-y-8">
              <div className="border border-white/10 bg-white/[0.025] p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-pixel text-[9px] text-white/70">
                      01 — SEU NOME
                    </p>

                    <p className="mt-2 text-xs text-white/35">
                      Como as pessoas vão encontrar você.
                    </p>
                  </div>

                  <span className="font-pixel text-[8px] text-pink-300">
                    @{usernamePreview}
                  </span>
                </div>

                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  maxLength={24}
                  placeholder="Ex.: Felipe"
                  className="mt-6 w-full border border-white/10 bg-black/30 px-4 py-4 font-main text-base text-white outline-none transition placeholder:text-white/20 focus:border-pink-400/50 focus:bg-black/40"
                />

                <p className="mt-3 text-[11px] text-white/25">
                  Mínimo de 3 caracteres.
                </p>
              </div>

              <div className="border border-white/10 bg-white/[0.025] p-6 sm:p-8">
                <div>
                  <p className="font-pixel text-[9px] text-white/70">
                    02 — SEU AVATAR
                  </p>

                  <p className="mt-2 text-xs text-white/35">
                    Escolha seu bichinho. Você pode trocar quando quiser.
                  </p>
                </div>

                <div className="mt-7 flex flex-col items-center gap-5 sm:flex-row">
                  <div className="flex h-28 w-28 items-center justify-center border border-pink-400/30 bg-pink-500/5 text-6xl shadow-[0_0_30px_rgba(236,72,153,0.12)]">
                    {avatar}
                  </div>

                  <button
                    type="button"
                    onClick={randomizeAvatar}
                    className="flex items-center gap-2 border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white/55 transition hover:border-pink-400/40 hover:text-pink-300"
                  >
                    <Dices className="h-4 w-4" />
                    Trocar bichinho
                  </button>
                </div>
              </div>

              {mode !== "solo" && (
                <div className="border border-white/10 bg-white/[0.025] p-6 sm:p-8">
                  <div>
                    <p className="font-pixel text-[9px] text-white/70">
                      03 — NOME DO ESPAÇO
                    </p>

                    <p className="mt-2 text-xs text-white/35">
                      {mode === "couple"
                        ? "Escolha o nome do espaço de vocês."
                        : "Escolha um nome para o espaço da galera."}
                    </p>
                  </div>

                  <input
                    value={spaceName}
                    onChange={(event) => setSpaceName(event.target.value)}
                    maxLength={40}
                    placeholder={
                      mode === "couple"
                        ? "Ex.: Felipe & Maria"
                        : "Ex.: Clube da Sessão"
                    }
                    className="mt-6 w-full border border-white/10 bg-black/30 px-4 py-4 font-main text-base text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50 focus:bg-black/40"
                  />
                </div>
              )}

              <div className="border border-white/5 bg-black/20 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center border border-white/10 bg-white/5 text-2xl">
                    {avatar}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-pixel text-[9px] text-white">
                      {username.trim() || "SEU NOME"}
                    </p>

                    <p className="mt-2 text-xs text-white/30">
                      @{usernamePreview}
                    </p>
                  </div>

                  <div className="ml-auto text-right">
                    <p className="font-pixel text-[7px] text-white/25">
                      MODO
                    </p>

                    <p
                      className={`mt-2 font-pixel text-[8px] ${
                        info.color === "pink"
                          ? "text-pink-300"
                          : info.color === "cyan"
                            ? "text-cyan-300"
                            : "text-purple-300"
                      }`}
                    >
                      {info.title}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue}
                className={`flex w-full items-center justify-center gap-3 border px-6 py-5 font-pixel text-[10px] uppercase tracking-widest transition ${
                  canContinue
                    ? "border-pink-400/60 bg-pink-500/15 text-pink-200 shadow-[0_0_35px_rgba(236,72,153,0.18)] hover:bg-pink-500/25"
                    : "cursor-not-allowed border-white/10 bg-white/5 text-white/20"
                }`}
              >
                {canContinue ? (
                  <>
                    <Check className="h-4 w-4" />
                    CRIAR MEU ESPAÇO
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  "PREENCHA OS CAMPOS"
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ConfigurarPage() {
  return (
    <Suspense
      fallback={
        <main className="retro-grid flex min-h-screen items-center justify-center">
          <div className="font-pixel text-[9px] text-pink-300">
            CARREGANDO...
          </div>
        </main>
      }
    >
      <ConfigurarContent />
    </Suspense>
  );
}
