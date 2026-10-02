"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ensureAnonymousUser,
  getUserProfile,
} from "@/lib/auth";

import {
  findWaitingSpaceByCode,
  joinSpace,
} from "@/lib/spaces";

export default function EntrarSalaPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    const normalized = code
      .trim()
      .toUpperCase();

    if (normalized.length !== 6) {
      setError("Digite um código de 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const space =
        await findWaitingSpaceByCode(normalized);

      if (!space) {
        setError(
          "Não encontramos uma sala aberta com esse código."
        );
        return;
      }

      const user = await ensureAnonymousUser();

      const profile =
        await getUserProfile(user.uid);

      if (!profile) {
        sessionStorage.setItem(
          "ditoefeito_join_code",
          normalized
        );

        router.push(
          `/configurar?mode=${space.mode}`
        );

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
      setError(
        "Não foi possível entrar nessa sala."
      );
    } finally {
      setLoading(false);
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

        <div className="mt-10 text-5xl">
          🎟️
        </div>

        <h1 className="mt-6 font-pixel text-lg text-white">
          ENTRAR NA SALA
        </h1>

        <p className="mt-4 text-lg text-slate-400">
          Digite o código que você recebeu.
        </p>

        <input
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 6)
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleJoin();
            }
          }}
          maxLength={6}
          autoFocus
          className="mt-8 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-5 text-center font-pixel text-2xl tracking-[0.2em] text-white outline-none transition focus:border-cyan-400"
          placeholder="ABC123"
        />

        {error && (
          <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-pink-500 px-5 py-4 font-pixel text-xs text-white shadow-[0_0_30px_rgba(255,0,127,.25)] transition hover:bg-pink-400 disabled:opacity-50"
        >
          {loading
            ? "PROCURANDO..."
            : "ENTRAR →"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-5 text-sm text-slate-500 hover:text-white"
        >
          Voltar
        </button>
      </section>
    </main>
  );
}
