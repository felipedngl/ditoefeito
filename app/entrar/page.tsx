"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Film,
  LogIn,
} from "lucide-react";

import {
  ensureAnonymousUser,
  signInWithGoogle,
} from "@/lib/auth";

export default function EntrarPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    try {
      setLoading(true);
      setError("");

      await signInWithGoogle();

      router.push("/configurar");
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
        setError("Não foi possível entrar com Google.");
      }

      setLoading(false);
    }
  }

  async function handleGuest() {
    try {
      setLoading(true);
      setError("");

      await ensureAnonymousUser();

      router.push("/configurar");
    } catch (err) {
      console.error(err);
      setError("Não foi possível entrar como convidado.");
      setLoading(false);
    }
  }

  return (
    <main className="retro-grid min-h-screen px-5 py-8">
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center">
        <section className="w-full rounded-3xl border border-white/10 bg-[#101522]/95 p-7 shadow-[0_0_70px_rgba(0,0,0,0.5)]">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-8 flex items-center gap-2 font-retro text-xl text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <div className="text-center">
            <div className="mb-5 flex justify-center text-pink-400">
              <Film size={42} />
            </div>

            <h1 className="font-pixel text-xl text-white">
              ENTRAR
            </h1>

            <p className="mt-4 font-retro text-xl text-slate-400">
              Escolha como quer entrar no Dito & Feito.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-5 font-pixel text-xs text-white transition hover:bg-cyan-400/20 disabled:opacity-60"
            >
              <LogIn size={21} />
              ENTRAR COM GOOGLE
            </button>

            <button
              type="button"
              onClick={handleGuest}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-pink-400/30 bg-pink-500/10 px-5 py-5 font-pixel text-xs text-white transition hover:bg-pink-500/20 disabled:opacity-60"
            >
              <Eye size={21} />
              ENTRAR COMO CONVIDADO
            </button>
          </div>

          {loading && (
            <p className="mt-6 text-center font-retro text-xl text-yellow-300">
              Entrando...
            </p>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center font-retro text-lg text-red-300">
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
