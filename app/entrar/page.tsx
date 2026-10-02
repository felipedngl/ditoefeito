"use client";

import { ArrowLeft, Film, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EntrarPage() {
  const router = useRouter();

  return (
    <main className="retro-grid min-h-screen overflow-hidden">
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="font-pixel text-[9px] tracking-widest text-white">
              DITO <span className="text-pink-400">&</span> FEITO
            </div>

            <div className="w-16" />
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
                <Film className="h-7 w-7 text-cyan-300" />
              </div>

              <p className="mt-8 font-pixel text-[9px] uppercase tracking-[0.25em] text-cyan-300">
                Bem-vindo de volta
              </p>

              <h1 className="mt-5 font-pixel text-xl leading-relaxed text-white">
                ENTRAR
              </h1>

              <p className="mt-5 font-retro text-2xl leading-relaxed text-white/40">
                Entre para continuar suas avaliações, biblioteca e grupos.
              </p>
            </div>

            <div className="mt-12 border border-white/10 bg-white/[0.025] p-6 sm:p-8">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 border border-white/15 bg-white/5 px-5 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:border-white/30 hover:bg-white/10"
              >
                <LogIn className="h-4 w-4" />
                Entrar com Google
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="font-pixel text-[7px] text-white/20">
                  OU
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <button
                type="button"
                onClick={() => router.push("/configurar?modo=solo")}
                className="w-full border border-pink-400/30 bg-pink-500/5 px-5 py-4 text-xs font-bold uppercase tracking-widest text-pink-300 transition hover:bg-pink-500/10"
              >
                Continuar como visitante
              </button>
            </div>

            <p className="mt-6 text-center text-[10px] leading-5 text-white/20">
              Você poderá vincular sua conta Google depois sem perder suas
              avaliações.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
