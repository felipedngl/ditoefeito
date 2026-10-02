"use client";

import { useEffect, useState } from "react";
import {
  Film,
  Search,
  Library,
  Trophy,
  UserRound,
  Star,
  LogOut,
} from "lucide-react";

type ProfileDraft = {
  username: string;
  usernameSlug: string;
  avatar: string;
  mode: "solo" | "couple" | "group";
  spaceName: string;
};

export default function FilmesPage() {
  const [profile, setProfile] = useState<ProfileDraft | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("dito-feito-profile-draft");

    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch {
        setProfile(null);
      }
    }
  }, []);

  return (
    <main className="retro-grid min-h-screen overflow-hidden">
      <div className="relative z-10 min-h-screen">
        {/* HEADER */}
        <header className="border-b border-white/10 bg-black/30 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-pink-400/40 bg-pink-500/10">
                <Film className="h-5 w-5 text-pink-300" />
              </div>

              <div className="hidden sm:block">
                <div className="font-pixel text-[9px] text-white">
                  DITO
                </div>

                <div className="font-pixel text-[9px] text-pink-300">
                  & FEITO
                </div>
              </div>
            </div>

            {/* SEARCH */}
            <div className="flex max-w-xl flex-1 items-center border border-white/10 bg-white/[0.03]">
              <Search className="ml-4 h-4 w-4 text-white/25" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar filmes..."
                className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25"
              />
            </div>

            {/* PROFILE */}
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="font-pixel text-[8px] text-white">
                  {profile?.username || "USUÁRIO"}
                </p>

                <p className="mt-1 text-[10px] text-white/30">
                  {profile?.mode === "group"
                    ? profile.spaceName || "GRUPINHO"
                    : profile?.mode === "couple"
                      ? profile.spaceName || "CASALZINHO"
                      : "SOZINHO"}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center border border-pink-400/30 bg-pink-500/5 text-xl">
                {profile?.avatar || "🐱"}
              </div>
            </div>
          </div>

          {/* NAV */}
          <nav className="border-t border-white/5">
            <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6">
              <button className="flex items-center gap-2 border-b-2 border-pink-400 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-pink-300">
                <Film className="h-3.5 w-3.5" />
                Filmes
              </button>

              <button className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/35 transition hover:text-white">
                <Library className="h-3.5 w-3.5" />
                Biblioteca
              </button>

              <button className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/35 transition hover:text-white">
                <Trophy className="h-3.5 w-3.5" />
                Pódio
              </button>

              <button className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/35 transition hover:text-white">
                <UserRound className="h-3.5 w-3.5" />
                Perfil
              </button>
            </div>
          </nav>
        </header>

        {/* CONTENT */}
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-14">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="font-pixel text-[9px] uppercase tracking-[0.25em] text-pink-300">
                {profile?.mode === "group"
                  ? "Seu grupinho"
                  : profile?.mode === "couple"
                    ? "Seu casalzinho"
                    : "Seu espaço"}
              </p>

              <h1 className="mt-4 font-pixel text-xl leading-relaxed text-white sm:text-2xl">
                DESCUBRA
                <br />
                <span className="text-pink-400">FILMES</span>
              </h1>

              <p className="mt-5 max-w-xl font-retro text-2xl text-white/40">
                Encontre uma história, dê sua nota e descubra o que vocês
                acharam dela.
              </p>
            </div>

            <div className="flex items-center gap-3 border border-yellow-400/20 bg-yellow-400/5 px-4 py-3">
              <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />

              <div>
                <p className="font-pixel text-[7px] text-yellow-300">
                  SUA NOTA
                </p>

                <p className="mt-1 text-[10px] text-white/30">
                  0,5 até 10
                </p>
              </div>
            </div>
          </div>

          {/* EMPTY SEARCH STATE */}
          <div className="mt-16 flex min-h-[380px] flex-col items-center justify-center border border-white/5 bg-white/[0.015] px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center border border-pink-400/20 bg-pink-500/5">
              <Film className="h-8 w-8 text-pink-300/60" />
            </div>

            <h2 className="mt-8 font-pixel text-[11px] text-white/70">
              {search
                ? `PROCURANDO POR "${search.toUpperCase()}"`
                : "COMECE SUA SESSÃO"}
            </h2>

            <p className="mt-4 max-w-md font-retro text-2xl text-white/30">
              {search
                ? "A busca TMDB entra aqui no próximo bloco."
                : "Digite o nome de um filme acima para encontrar sua próxima história."}
            </p>
          </div>

          {/* QUICK LINKS */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <button className="border border-white/5 bg-white/[0.02] p-5 text-left transition hover:border-pink-400/20 hover:bg-pink-500/[0.03]">
              <Library className="h-5 w-5 text-pink-300" />

              <p className="mt-5 font-pixel text-[8px] text-white/60">
                MINHA BIBLIOTECA
              </p>

              <p className="mt-2 text-xs text-white/25">
                Tudo que você já avaliou.
              </p>
            </button>

            <button className="border border-white/5 bg-white/[0.02] p-5 text-left transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.03]">
              <Trophy className="h-5 w-5 text-cyan-300" />

              <p className="mt-5 font-pixel text-[8px] text-white/60">
                PÓDIO
              </p>

              <p className="mt-2 text-xs text-white/25">
                Os favoritos de vocês.
              </p>
            </button>

            <button className="border border-white/5 bg-white/[0.02] p-5 text-left transition hover:border-purple-400/20 hover:bg-purple-400/[0.03]">
              <UserRound className="h-5 w-5 text-purple-300" />

              <p className="mt-5 font-pixel text-[8px] text-white/60">
                MEU PERFIL
              </p>

              <p className="mt-2 text-xs text-white/25">
                Suas notas e suas histórias.
              </p>
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/5 px-6 py-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <p className="font-pixel text-[7px] text-white/20">
              DITO & FEITO © 2026
            </p>

            <button className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/20 transition hover:text-white/50">
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
