"use client";

import { useState } from "react";
import {
  Film,
  LogIn,
  Play,
  Users,
  UserRound,
  Heart,
} from "lucide-react";

type ModeId = "solo" | "couple" | "group";
type ModeColor = "pink" | "cyan" | "purple";

type Mode = {
  id: ModeId;
  title: string;
  description: string;
  icon: typeof UserRound;
  color: ModeColor;
  badge?: string;
};

const modes: Mode[] = [
  {
    id: "solo",
    title: "SOZINHO",
    description:
      "Seu espaço pessoal para descobrir, avaliar e organizar tudo o que você assiste.",
    icon: UserRound,
    color: "pink",
    badge: "1 pessoa",
  },
  {
    id: "couple",
    title: "CASALZINHO",
    description:
      "Crie um cantinho a dois para comparar opiniões e descobrir os filmes e séries favoritos de vocês.",
    icon: Heart,
    color: "cyan",
    badge: "2 pessoas",
  },
  {
    id: "group",
    title: "GRUPINHO",
    description:
      "Reúna sua galera, cada um dá sua nota e vocês descobrem juntos os favoritos do grupo.",
    icon: Users,
    color: "purple",
    badge: "3–10 pessoas",
  },
];

const colorClasses: Record<
  ModeColor,
  {
    border: string;
    bg: string;
    text: string;
    glow: string;
  }
> = {
  pink: {
    border: "border-pink-500/30",
    bg: "bg-pink-500/10",
    text: "text-pink-300",
    glow: "shadow-[0_0_30px_rgba(236,72,153,0.15)]",
  },
  cyan: {
    border: "border-cyan-400/30",
    bg: "bg-cyan-400/10",
    text: "text-cyan-300",
    glow: "shadow-[0_0_30px_rgba(34,211,238,0.15)]",
  },
  purple: {
    border: "border-purple-400/30",
    bg: "bg-purple-400/10",
    text: "text-purple-300",
    glow: "shadow-[0_0_30px_rgba(192,132,252,0.15)]",
  },
};

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<ModeId | null>(null);

  const selectedModeData = modes.find((mode) => mode.id === selectedMode);

  return (
    <main className="retro-grid min-h-screen overflow-hidden">
      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-pink-400/40 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
              <Film className="h-5 w-5 text-pink-300" />
            </div>

            <div>
              <div className="font-pixel text-[10px] tracking-wider text-white sm:text-xs">
                DITO
              </div>
              <div className="font-pixel text-[10px] tracking-wider text-pink-300 sm:text-xs">
                & FEITO
              </div>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 border border-cyan-400/30 bg-cyan-400/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 transition hover:border-cyan-300/60 hover:bg-cyan-400/10"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-20 sm:pb-24 sm:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 border border-pink-400/30 bg-pink-500/5 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-pink-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
            Seu cinema. Suas regras.
          </div>

          <h1 className="font-pixel text-3xl leading-relaxed text-white drop-shadow-[0_0_25px_rgba(236,72,153,0.35)] sm:text-5xl sm:leading-relaxed">
            DITO
            <span className="text-pink-400"> & </span>
            FEITO
          </h1>

          <p className="mx-auto mt-8 max-w-2xl font-retro text-2xl leading-relaxed text-white/65 sm:text-3xl">
            Avalie filmes e séries, descubra seus favoritos e veja o que as
            pessoas que você gosta acharam também.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-widest text-white/40">
            <span>FILMES</span>
            <span className="text-pink-400">✦</span>
            <span>SÉRIES</span>
            <span className="text-cyan-400">✦</span>
            <span>AMIGOS</span>
            <span className="text-purple-400">✦</span>
            <span>NOTAS</span>
          </div>
        </div>

        {/* Mode selector */}
        <div className="mx-auto mt-20 max-w-6xl">
          <div className="mb-8 text-center">
            <p className="font-pixel text-[10px] uppercase tracking-widest text-white/40">
              Como você quer usar?
            </p>

            <h2 className="mt-4 font-retro text-3xl text-white sm:text-4xl">
              Escolha seu modo
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const colors = colorClasses[mode.color];
              const selected = selectedMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`group relative text-left transition duration-300 hover:-translate-y-1 ${
                    selected
                      ? "border-white/30 bg-white/10"
                      : `border-white/8 bg-white/[0.025] ${colors.border} ${colors.bg}`
                  } ${colors.glow} border p-6`}
                >
                  {/* Card glow */}
                  <div
                    className={`pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 ${
                      colors.bg
                    }`}
                  />

                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center border ${colors.border} ${colors.bg}`}
                      >
                        <Icon className={`h-5 w-5 ${colors.text}`} />
                      </div>

                      {mode.badge && (
                        <span
                          className={`border ${colors.border} px-2 py-1 font-pixel text-[7px] ${colors.text}`}
                        >
                          {mode.badge}
                        </span>
                      )}
                    </div>

                    <h3
                      className={`mt-7 font-pixel text-sm tracking-wide ${colors.text}`}
                    >
                      {mode.title}
                    </h3>

                    <p className="mt-4 min-h-[80px] font-main text-sm leading-6 text-white/55">
                      {mode.description}
                    </p>

                    <div
                      className={`mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${colors.text}`}
                    >
                      <span>
                        {selected ? "Selecionado" : "Escolher modo"}
                      </span>

                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mx-auto mt-12 flex max-w-md flex-col items-center">
          <button
            type="button"
            disabled={!selectedMode}
            className={`group flex w-full items-center justify-center gap-3 border px-7 py-4 font-pixel text-[10px] uppercase tracking-widest transition ${
              selectedMode
                ? "border-pink-400/60 bg-pink-500/15 text-pink-200 shadow-[0_0_35px_rgba(236,72,153,0.2)] hover:bg-pink-500/25"
                : "cursor-not-allowed border-white/10 bg-white/5 text-white/25"
            }`}
          >
            <Play className="h-4 w-4 fill-current" />
            COMEÇAR AGORA
          </button>

          {selectedModeData && (
            <p className="mt-4 text-center text-xs text-white/35">
              Modo selecionado:{" "}
              <span className="text-white/60">
                {selectedModeData.title}
              </span>
            </p>
          )}
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-8 border-y border-white/5 py-10 sm:grid-cols-3">
          <div className="text-center">
            <div className="font-pixel text-[9px] text-pink-300">
              01 — AVALIE
            </div>
            <p className="mt-3 font-main text-sm text-white/40">
              Dê sua nota de 0,5 a 10 para filmes e séries.
            </p>
          </div>

          <div className="text-center">
            <div className="font-pixel text-[9px] text-cyan-300">
              02 — COMPARTILHE
            </div>
            <p className="mt-3 font-main text-sm text-white/40">
              Compare opiniões sem perder sua avaliação pessoal.
            </p>
          </div>

          <div className="text-center">
            <div className="font-pixel text-[9px] text-purple-300">
              03 — DESCUBRA
            </div>
            <p className="mt-3 font-main text-sm text-white/40">
              Monte rankings e descubra os favoritos da sua turma.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/20 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="font-pixel text-[8px] tracking-wider text-white/25">
            DITO & FEITO © 2026
          </div>

          <div className="font-retro text-lg text-white/20">
            Feito para quem ama histórias.
          </div>
        </div>
      </footer>
    </main>
  );
}
