"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ensureAnonymousUser,
  signInWithGoogle,
} from "@/lib/auth";

function EntrarSalaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = (searchParams.get("code") || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  const [entering, setEntering] = useState(false);
  const [error, setError] = useState("");

  function continueToProfile() {
    if (!code) {
      setError(
        "Este convite não possui um código válido. Peça um novo link ao anfitrião."
      );
      return;
    }

    /*
     * O código agora segue pela própria URL.
     *
     * Antes:
     * /sala?code=ABC123
     *       ↓
     * sessionStorage
     *       ↓
     * /configurar
     *
     * Agora:
     * /sala?code=ABC123
     *       ↓
     * /configurar?mode=couple&code=ABC123
     *
     * Assim não dependemos de armazenamento local.
     */
    router.push(
      `/configurar?mode=couple&code=${encodeURIComponent(code)}`
    );
  }

  async function enterWithGoogle() {
    try {
      setEntering(true);
      setError("");

      await signInWithGoogle();

      continueToProfile();
    } catch (err) {
      console.error(err);

      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code ===
          "auth/popup-closed-by-user"
      ) {
        setError("A janela de login foi fechada.");
      } else {
        setError(
          "Não foi possível entrar com Google. Tente novamente."
        );
      }

      setEntering(false);
    }
  }

  async function enterAsGuest() {
    try {
      setEntering(true);
      setError("");

      await ensureAnonymousUser();

      continueToProfile();
    } catch (err) {
      console.error(err);

      setError(
        "Não foi possível entrar como convidado. Tente novamente."
      );

      setEntering(false);
    }
  }

  return (
    <main className="retro-grid min-h-screen flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/30 p-6 text-center shadow-2xl backdrop-blur md:p-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="font-pixel text-[10px] text-cyan-300 transition hover:text-white"
        >
          DITO & FEITO
        </button>

        {!code ? (
          <div className="py-16">
            <div className="text-6xl">
              🎟️
            </div>

            <h1 className="mt-6 font-pixel text-lg text-white">
              CONVITE NECESSÁRIO
            </h1>

            <p className="mt-5 leading-relaxed text-slate-400">
              Para entrar em uma sessão, abra o link de convite enviado pelo
              anfitrião.
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-8 w-full rounded-xl border border-white/10 px-5 py-4 font-pixel text-[10px] text-slate-300 transition hover:border-cyan-400 hover:text-white"
            >
              VOLTAR AO INÍCIO
            </button>
          </div>
        ) : (
          <div className="py-8">
            <div className="text-6xl">
              🎟️
            </div>

            <div className="mt-7 font-pixel text-[10px] text-pink-400">
              VOCÊ FOI CONVIDADO!
            </div>

            <h1 className="mt-4 font-pixel text-xl leading-relaxed text-white">
              UMA SESSÃO ESTÁ ESPERANDO POR VOCÊ
            </h1>

            <p className="mt-5 leading-relaxed text-slate-400">
              Entre com sua conta ou como convidado. Depois você configura seu
              nome e avatar e será levado automaticamente para a sala de espera.
            </p>

            <div className="mt-8 grid gap-3">
              <button
                type="button"
                onClick={enterWithGoogle}
                disabled={entering}
                className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 font-pixel text-[10px] text-white transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {entering
                  ? "PREPARANDO..."
                  : "ENTRAR COM GOOGLE"}
              </button>

              <button
                type="button"
                onClick={enterAsGuest}
                disabled={entering}
                className="rounded-xl border border-pink-400/30 bg-pink-500/10 px-5 py-4 font-pixel text-[10px] text-white transition hover:border-pink-300 hover:bg-pink-500/20 disabled:cursor-not-allowed disabled:opacity-50"
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

            {error && (
              <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
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
