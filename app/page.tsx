"use client";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  ArrowRight,
  Eye,
  Gamepad2,
  LogIn,
  Sparkles,
  Users,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  ensureAnonymousUser,
  signInWithGoogle,
} from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <main className="retro-grid min-h-screen px-5 py-8">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center">

        <div className="mb-8 text-center">

          <div className="mb-5 flex justify-center">
            <img
              src="/logo.png"
              alt="Dito & Feito"
              className="h-auto max-h-40 w-full max-w-[420px] object-contain drop-shadow-[0_0_25px_rgba(255,0,127,0.25)]"
            />
          </div>

          <p className="mx-auto mt-5 max-w-xl font-retro text-2xl text-cyan-300 sm:text-3xl">
            Seu cantinho para assistir, avaliar e descobrir filmes e séries.
          </p>

        </div>

        <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#101522]/90 p-6 shadow-[0_0_60px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">

          <div className="mb-6 text-center">

            <p className="font-pixel text-sm text-yellow-300">
              COMO VOCÊ QUER ENTRAR?
            </p>

            <p className="mt-3 font-retro text-xl text-slate-400">
              Você pode começar como convidado e conectar sua conta Google depois.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="group flex min-h-[100px] flex-col items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-5 transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn
                size={28}
                className="mb-2 text-cyan-300 transition group-hover:scale-110"
              />

              <span className="font-pixel text-xs text-white">
                ENTRAR COM GOOGLE
              </span>

              <span className="mt-2 font-retro text-lg text-cyan-200">
                Salvar sua conta
              </span>
            </button>

            <button
              type="button"
              onClick={handleGuest}
              disabled={loading}
              className="group flex min-h-[100px] flex-col items-center justify-center rounded-2xl border border-pink-400/30 bg-pink-500/10 px-5 py-5 transition hover:border-pink-300 hover:bg-pink-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Eye
                size={28}
                className="mb-2 text-pink-300 transition group-hover:scale-110"
              />

              <span className="font-pixel text-xs text-white">
                ENTRAR COMO CONVIDADO
              </span>

              <span className="mt-2 font-retro text-lg text-pink-200">
                Começar agora
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => router.push("/sala")}
              className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/5 px-5 py-4 font-pixel text-xs text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/10 hover:text-white"
            >
              🎟️ ENTRAR COM CÓDIGO
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

        <div className="mt-8 grid w-full max-w-2xl grid-cols-3 gap-3">

          <Feature
            icon={<Gamepad2 size={20} />}
            title="SOZINHO"
          />

          <Feature
            icon={<Users size={20} />}
            title="CASALZINHO"
          />

          <Feature
            icon={<Sparkles size={20} />}
            title="GRUPINHO"
          />

        </div>

        <p className="mt-8 flex items-center gap-2 font-retro text-lg text-slate-500">
          <ArrowRight size={16} />
          Primeiro entre. Depois escolha sua experiência.
        </p>

      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-5 text-center">

      <div className="mb-2 text-purple-400">
        {icon}
      </div>

      <span className="font-pixel text-[9px] text-slate-300">
        {title}
      </span>

    </div>
  );
}
