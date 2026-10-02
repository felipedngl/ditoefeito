"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Film,
  LogOut,
  Search,
  Trophy,
  UserRound,
} from "lucide-react";

import {
  getUserProfile,
  subscribeToAuth,
  type UserProfile,
} from "@/lib/auth";

export default function FilmesPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);

        if (!userProfile) {
          router.replace("/configurar");
          return;
        }

        setProfile(userProfile);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <main className="retro-grid flex min-h-screen items-center justify-center">
        <div className="font-pixel text-sm text-pink-400">
          CARREGANDO...
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="retro-grid min-h-screen px-5 pb-12">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 py-6">
          <button
            type="button"
            onClick={() => router.push("/filmes")}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-pink-400/30 bg-pink-500/10">
              <Film className="text-pink-400" size={24} />
            </div>

            <span className="font-pixel text-sm text-white">
              DITO <span className="text-pink-400">&</span> FEITO
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-2xl">
              {profile.avatar}
            </div>

            <div className="hidden sm:block">
              <div className="font-pixel text-[10px] text-white">
                {profile.username}
              </div>

              <div className="font-retro text-lg text-slate-500">
                @{profile.usernameSlug}
              </div>
            </div>
          </div>
        </header>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-2">
          <NavButton
            active
            icon={<Film size={17} />}
            label="Filmes"
            onClick={() => router.push("/filmes")}
          />

          <NavButton
            icon={<BookOpen size={17} />}
            label="Biblioteca"
            onClick={() => router.push("/filmes/biblioteca")}
          />

          <NavButton
            icon={<Trophy size={17} />}
            label="Pódio"
            onClick={() => router.push("/filmes/podio")}
          />

          <NavButton
            icon={<UserRound size={17} />}
            label="Perfil"
            onClick={() => router.push("/perfil")}
          />
        </nav>

        <section className="mt-12">
          <div className="text-center">
            <p className="font-pixel text-xs text-pink-400">
              OLÁ, {profile.username.toUpperCase()}
            </p>

            <h1 className="mt-5 font-pixel text-2xl leading-relaxed text-white sm:text-4xl">
              O QUE VOCÊ QUER ASSISTIR?
            </h1>

            <p className="mx-auto mt-4 max-w-2xl font-retro text-2xl text-slate-400">
              Pesquise por um filme ou série e comece sua próxima sessão.
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-3xl items-center gap-3 rounded-2xl border border-pink-400/30 bg-[#101522] px-5 py-5 shadow-[0_0_35px_rgba(255,0,127,0.1)]">
            <Search
              size={28}
              className="shrink-0 text-pink-400"
            />

            <input
              type="text"
              placeholder="Digite o nome de um filme ou série..."
              className="w-full bg-transparent font-retro text-2xl text-white outline-none placeholder:text-slate-600"
            />
          </div>
        </section>

        <section className="mt-14">
          <SectionTitle title="FILMES" />

          <EmptyCarousel text="O catálogo de filmes aparecerá aqui." />
        </section>

        <section className="mt-12">
          <SectionTitle title="SÉRIES" />

          <EmptyCarousel text="O catálogo de séries aparecerá aqui." />
        </section>

        <section className="mt-12">
          <SectionTitle title="MAIS POPULARES" />

          <EmptyCarousel text="As recomendações aparecerão aqui." />
        </section>
      </div>
    </main>
  );
}

function NavButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 font-retro text-xl transition",
        active
          ? "border-pink-400/40 bg-pink-500/10 text-pink-200"
          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <div className="h-px flex-1 bg-white/10" />

      <h2 className="font-pixel text-xs text-cyan-300">
        {title}
      </h2>

      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function EmptyCarousel({ text }: { text: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02]">
      <p className="font-retro text-xl text-slate-600">
        {text}
      </p>
    </div>
  );
}
