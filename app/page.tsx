"use client";

import { useState } from "react";
import { Film, LogIn, Play, Users, UserRound, Heart } from "lucide-react";

const modes = [
  {
    id: "solo",
    icon: UserRound,
    title: "SOLO",
    description: "Suas notas, seus filmes, seu ranking.",
    color: "pink",
  },
  {
    id: "couple",
    icon: Heart,
    title: "CASALZINHO",
    description: "Assistam, avaliem e descubram seus favoritos juntos.",
    color: "purple",
  },
  {
    id: "group",
    icon: Users,
    title: "GRUPINHO",
    description: "Até 10 pessoas, um ranking e muita discussão.",
    color: "cyan",
  },
];

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fundo retrô */}
      <div className="retro-grid" />

      {/* Luzes decorativas */}
      <div className="pointer-events-none absolute left-[10%] top-[15%] h-40 w-40 rounded-full bg-pink-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[10%] top-[30%] h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 md:px-8">

        {/* HEADER */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-pink-400/30 bg-pink-500/10">
              <Film
                size={22}
                className="text-pink-400"
              />
            </div>

            <div>
              <div className="font-pixel text-[10px] tracking-tight text-white sm:text-xs">
                DITO
                <span className="text-pink-400"> & </span>
                FEITO
              </div>

              <p className="mt-1 font-retro text-lg text-slate-500">
                filmes • séries • opiniões
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-pink-400/40 hover:bg-pink-500/10 hover:text-white"
          >
            <LogIn size={17} />
            Entrar
          </button>
        </header>

        {/* HERO */}
        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">

          <div className="mb-7 flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />

            <span className="font-retro text-xl text-cyan-300">
              SEU CINEMA. SUAS REGRAS.
            </span>
          </div>

          <h1 className="max-w-4xl font-pixel text-2xl leading-relaxed text-white sm:text-4xl md:text-5xl">
            DITO
            <span className="text-pink-400 glow-pink"> & </span>
            FEITO
          </h1>

          <p className="mt-6 max-w-2xl font-retro text-2xl leading-relaxed text-slate-400 sm:text-3xl">
            Um lugar para guardar, avaliar e discutir
            <span className="text-white"> tudo o que você assiste.</span>
          </p>

          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
            Crie seu ranking pessoal ou convide quem você gosta
            para descobrir quais filmes e séries merecem entrar
            para a história.
          </p>

          {/* CTA */}
          <button
            type="button"
            className="mt-8 flex items-center gap-3 rounded-2xl border border-pink-400/40 bg-pink-500 px-7 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(255,0,127,0.25)] transition hover:scale-[1.02] hover:bg-pink-400 hover:shadow-[0_0_40px_rgba(255,0,127,0.4)]"
          >
            <Play size={18} fill="currentColor" />
            COMEÇAR AGORA
          </button>

          {/* MODOS */}
          <div className="mt-16 w-full">
            <div className="mb-7">
              <p className="font-pixel text-[9px] text-slate-500">
                ESCOLHA SEU MODO
              </p>

              <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
            </div>

            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const selected = selectedMode === mode.id;

                const colorClasses = {
                  pink: {
                    border: "hover:border-pink-400/50",
                    icon: "text-pink-400",
                    bg: "hover:bg-pink-500/5",
                  },
                  purple: {
                    border: "hover:border-purple-400/50",
                    icon: "text-purple-400",
                    bg: "hover:bg-purple-500/5",
                  },
                  cyan: {
                    border: "hover:border-cyan-400/50",
                    icon: "text-cyan-400",
                    bg: "hover:bg-cyan-500/5",
                  },
                }[mode.color];

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id)}
                    className={`group rounded-2xl border p-6 text-left transition duration-300 ${
                      selected
                        ? "border-white/30 bg-white/10"
                        : `border-white/8 bg-white/[0.025] ${colorClasses.border} ${colorClasses.bg}`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                        <Icon
                          size={23}
                          className={`${colorClasses.icon} transition group-hover:scale-110`}
                        />
                      </div>

                      {selected && (
                        <span className="rounded-full bg-white/10 px-2.5 py-1 font-retro text-lg text-white">
                          selecionado
                        </span>
                      )}
                    </div>

                    <h2 className="mt-5 font-pixel text-[10px] text-white">
                      {mode.title}
                    </h2>

                    <p className="mt-3 text-sm leading-5 text-slate-500">
                      {mode.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/5 pt-5 text-center">
          <p className="font-retro text-lg text-slate-600">
            DITO & FEITO © 2026
          </p>
        </footer>
      </div>
    </main>
  );
}
