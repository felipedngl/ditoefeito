
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ensureAnonymousUser,
  getUserProfile,
  signInWithGoogle,
} from "@/lib/auth";
import { findWaitingSpaceByCode, joinSpace } from "@/lib/spaces";

function EntrarSalaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState("");
  const [spaceName, setSpaceName] = useState("");
  const [spaceMode, setSpaceMode] = useState<"couple" | "group" | null>(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const inviteCode = (searchParams.get("code") || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);

    if (!inviteCode) {
      setLoading(false);
      return;
    }

    let active = true;
    setCode(inviteCode);

    async function loadInvite() {
      try {
        const space = await findWaitingSpaceByCode(inviteCode);

        if (!active) return;

        if (!space) {
          setError("Este convite não está disponível. Peça um novo link ao anfitrião.");
          setLoading(false);
          return;
        }

        setSpaceName(space.name);
        setSpaceMode(space.mode);
        setLoading(false);
      } catch (err) {
        console.error(err);

        if (!active) return;

        setError("Não foi possível carregar o convite. Tente novamente.");
        setLoading(false);
      }
    }

    loadInvite();

    return () => {
      active = false;
    };
  }, [searchParams]);

  async function enterWithGoogle() {
    try {
      setEntering(true);
      setError("");

      const user = await signInWithGoogle();
      const profile = await getUserProfile(user.uid);

      if (!profile) {
        sessionStorage.setItem("ditoefeito_join_code", code);
        router.push(`/configurar?mode=${spaceMode ?? "couple"}`);
        return;
      }

      const space = await findWaitingSpaceByCode(code);

      if (!space) {
        setError("Esta sala não está mais disponível.");
        setEntering(false);
        return;
      }

      await joinSpace({
        space,
        uid: user.uid,
        username: profile.username,
        avatar: profile.avatar,
      });

      router.push(`/sala/${space.id}`);
    } catch (err) {
      console.error(err);
      setError("Não foi possível entrar com Google. Tente novamente.");
      setEntering(false);
    }
  }

  async function enterAsGuest() {
    try {
      setEntering(true);
      setError("");

      const user = await ensureAnonymousUser();
      const profile = await getUserProfile(user.uid);

      if (!profile) {
        sessionStorage.setItem("ditoefeito_join_code", code);
        router.push(`/configurar?mode=${spaceMode ?? "couple"}`);
        return;
      }

      const space = await findWaitingSpaceByCode(code);

      if (!space) {
        setError("Esta sala não está mais disponível.");
        setEntering(false);
        return;
      }

      await joinSpace({
        space,
        uid: user.uid,
        username: profile.username,
        avatar: profile.avatar,
      });

      router.push(`/sala/${space.id}`);
    } catch (err) {
      console.error(err);
      setError("Não foi possível entrar como convidado. Tente novamente.");
      setEntering(false);
    }
  }

  return (
    <main className="retro-grid min-h-screen flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/30 p-6 text-center shadow-2xl backdrop-blur md:p-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="font-pixel text-[10px] text-cyan-300 hover:text-white"
        >
          DITO & FEITO
        </button>

        {loading ? (
          <div className="py-20">
            <div className="text-5xl">🎟️</div>
            <p className="mt-6 font-pixel text-xs text-cyan-300">
              CARREGANDO CONVITE...
            </p>
          </div>
        ) : !code ? (
          <div className="py-12">
            <div className="text-5xl">🎟️</div>
            <h1 className="mt-6 font-pixel text-lg text-white">
              ENTRE EM UMA SESSÃO
            </h1>
            <p className="mt-4 leading-relaxed text-slate-400">
              Para entrar em uma sala, abra o link de convite enviado pelo anfitrião.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-8 w-full rounded-xl border border-white/10 px-5 py-4 font-pixel text-[10px] text-slate-300 hover:border-cyan-400 hover:text-white"
            >
              VOLTAR AO INÍCIO
            </button>
          </div>
        ) : error ? (
          <div className="py-12">
            <div className="text-5xl">💥</div>
            <h1 className="mt-6 font-pixel text-lg text-white">
              CONVITE INDISPONÍVEL
            </h1>
            <p className="mt-4 leading-relaxed text-slate-400">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-8 rounded-xl border border-white/10 px-6 py-4 font-pixel text-[10px] text-slate-300 hover:border-cyan-400 hover:text-white"
            >
              VOLTAR AO INÍCIO
            </button>
          </div>
        ) : (
          <div className="py-8">
            <div className="text-6xl">🎟️</div>

            <div className="mt-6 font-pixel text-[10px] text-pink-400">
              VOCÊ FOI CONVIDADO!
            </div>

            <h1 className="mt-4 font-pixel text-xl leading-relaxed text-white">
              {spaceName}
            </h1>

            <div className="mt-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs text-cyan-300">
              {spaceMode === "couple" ? "💞 CASALZINHO" : "👾 GRUPINHO"}
            </div>

            <p className="mt-6 leading-relaxed text-slate-400">
              Escolha como entrar. Depois, configure seu nome e avatar para
              participar da sala de espera.
            </p>

            <div className="mt-8 grid gap-3">
              <button
                type="button"
                onClick={enterWithGoogle}
                disabled={entering}
                className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 font-pixel text-[10px] text-white transition hover:bg-cyan-400/20 disabled:opacity-50"
              >
                {entering ? "PREPARANDO..." : "ENTRAR COM GOOGLE"}
              </button>

              <button
                type="button"
                onClick={enterAsGuest}
                disabled={entering}
                className="rounded-xl border border-pink-400/30 bg-pink-500/10 px-5 py-4 font-pixel text-[10px] text-white transition hover:bg-pink-500/20 disabled:opacity-50"
              >
                ENTRAR COMO CONVIDADO
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-white/5 bg-white/[.03] p-4">
              <div className="font-pixel text-[9px] text-slate-500">
                CÓDIGO DO CONVITE
              </div>
              <div className="mt-2 font-pixel text-lg tracking-[0.2em] text-white">
                {code}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function EntrarSalaPage() {
  return (
    <Suspense
      fallback={
        <main className="retro-grid min-h-screen flex items-center justify-center">
          <div className="font-pixel text-xs text-cyan-300">
            CARREGANDO...
          </div>
        </main>
      }
    >
      <EntrarSalaContent />
    </Suspense>
  );
}
