"use client";

import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Copy,
  Film,
  Save,
  Trophy,
  UserRound,
} from "lucide-react";

import {
  AVATARS,
  createUsername,
  getUserProfile,
  randomAvatar,
  saveUserProfile,
  slugifyUsername,
  subscribeToAuth,
  type UserProfile,
} from "@/lib/auth";

import {
  getUserSpaces,
  type Space,
} from "@/lib/spaces";

export default function PerfilPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);
    
  const [userSpaces, setUserSpaces] = useState<Space[]>([]);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      try {
        const userProfile =
          await getUserProfile(user.uid);

        if (!userProfile) {
          router.replace("/configurar");
          return;
        }

        setProfile(userProfile);
        setUsername(userProfile.username);
        setAvatar(userProfile.avatar);
                
        const spaces = await getUserSpaces(user.uid);
        setUserSpaces(spaces);
      } catch (err) {
        console.error(err);

        setError(
          "Não foi possível carregar seu perfil."
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  function sortearNome() {
    setUsername(createUsername());
    setSaved(false);
    setError("");
  }

  function sortearAvatar() {
    setAvatar(randomAvatar());
    setSaved(false);
    setError("");
  }

  async function handleSave() {
    if (!profile) return;

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError("Escolha um nome para continuar.");
      return;
    }

    if (!avatar) {
      setError("Escolha um avatar para continuar.");
      return;
    }

    const newSlug = slugifyUsername(cleanUsername);

    if (!newSlug) {
      setError(
        "Escolha um nome que possa ser usado no seu perfil."
      );
      return;
    }

    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const user = auth.currentUser;

      if (!user) {
        throw new Error("Usuário não autenticado.");
      }

      await saveUserProfile(user, {
        username: cleanUsername,
        usernameSlug: newSlug,
        avatar,

        mode: profile.mode,
        spaceName: profile.spaceName || "",
      });

      const updatedProfile: UserProfile = {
        ...profile,
        username: cleanUsername,
        usernameSlug: newSlug,
        avatar,
      };

      setProfile(updatedProfile);

      sessionStorage.setItem(
        "ditoefeito_profile",
        JSON.stringify(updatedProfile)
      );

      setSaved(true);
    } catch (err) {
      console.error(err);

      setError(
        "Não foi possível salvar seu perfil. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyProfileLink() {
    if (!profile || typeof window === "undefined") {
      return;
    }

    const slug =
      profile.usernameSlug ||
      slugifyUsername(profile.username);

    const url =
      `${window.location.origin}/perfil/${slug}`;

    try {
      await navigator.clipboard.writeText(url);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.error(
        "Não foi possível copiar o link:",
        err
      );

      setError(
        "Não foi possível copiar o link do perfil."
      );
    }
  }

  function openPublicProfile() {
    if (!profile) return;

    const slug =
      profile.usernameSlug ||
      slugifyUsername(profile.username);

    router.push(`/perfil/${slug}`);
  }

  if (loading) {
    return (
      <main className="retro-grid flex min-h-screen items-center justify-center">
        <div className="font-pixel text-sm text-pink-400">
          CARREGANDO PERFIL...
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  const profileSlug =
    profile.usernameSlug ||
    slugifyUsername(profile.username);

  const hasSpace =
    profile.mode !== "solo" &&
    !!profile.spaceName?.trim();

  const modeLabel =
    profile.mode === "couple"
      ? "CASALZINHO"
      : profile.mode === "group"
        ? "GRUPINHO"
        : "SOZINHO";

  return (
    <main className="retro-grid min-h-screen text-white">
      <header className="border-b border-white/10 bg-[#070910]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-6">
          <button
            type="button"
            onClick={() => router.push("/filmes")}
            className="flex items-center gap-2"
            aria-label="Voltar para o catálogo"
          >
            <img
              src="/logo.png"
              alt="Dito & Feito"
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          </button>

          <button
            type="button"
            onClick={() => router.push("/filmes")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-pixel text-[9px] text-slate-300 transition hover:border-pink-400/40 hover:text-white"
          >
            <Film size={15} />
            MEU CINEMA
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <nav className="flex gap-2 overflow-x-auto py-5">
          <NavButton
            icon={<Film size={16} />}
            label="CATÁLOGO"
            onClick={() =>
              router.push("/filmes")
            }
          />

          <NavButton
            icon={<BookOpen size={16} />}
            label="BIBLIOTECA"
            onClick={() =>
              router.push("/filmes/biblioteca")
            }
          />

          <NavButton
            icon={<Trophy size={16} />}
            label="PÓDIO"
            onClick={() =>
              router.push("/filmes/podio")
            }
          />

          <NavButton
            icon={<UserRound size={16} />}
            label="PERFIL"
            active
            onClick={() =>
              router.push("/perfil")
            }
          />
        </nav>

        <div className="mt-5">
          <p className="font-pixel text-[9px] text-pink-300">
            SUA IDENTIDADE
          </p>

          <h1 className="mt-2 font-pixel text-2xl text-white md:text-4xl">
            MEU PERFIL
          </h1>

          <p className="mt-3 max-w-2xl font-retro text-base leading-6 text-slate-400 md:text-lg">
            Seu espaço pessoal no Dito & Feito.
          </p>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-5 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-pink-400/40 bg-pink-500/10 text-6xl shadow-[0_0_50px_rgba(255,0,127,0.12)]">
              {avatar}
            </div>

            <h2 className="mt-5 font-pixel text-xl text-white">
              {username}
            </h2>

            <div className="mt-2 font-retro text-lg text-slate-500">
              @{profileSlug}
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-pink-400/20 bg-pink-500/10 px-3 py-2 font-pixel text-[8px] text-pink-300">
                {modeLabel}
              </span>

              {userSpaces.map((space) => (
                <span
                  key={space.id}
                  className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 font-pixel text-[8px] text-cyan-300"
                >
                  💞 {space.name}
                </span>
              ))}
            </div>

            <div className="mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={copyProfileLink}
                className={[
                  "flex items-center justify-center gap-2 rounded-xl border px-5 py-3 font-pixel text-[9px] transition",
                  copied
                    ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-300"
                    : "border-pink-400/30 bg-pink-500/10 text-pink-300 hover:border-pink-300 hover:text-white",
                ].join(" ")}
              >
                <Copy size={15} />

                {copied
                  ? "LINK COPIADO!"
                  : `@${profileSlug}`}
              </button>

              <button
                type="button"
                onClick={openPublicProfile}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-pixel text-[9px] text-slate-300 transition hover:border-cyan-400/30 hover:text-white"
              >
                <UserRound size={15} />
                VER PERFIL PÚBLICO
              </button>
            </div>

            <p className="mt-3 max-w-xl font-retro text-sm text-slate-600">
              Clique em @{profileSlug} para copiar o
              endereço completo do seu perfil.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl border-t border-white/10 pt-8">
            <label className="mb-3 block font-pixel text-[9px] text-cyan-300">
              SEU NOME
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setSaved(false);
                  setError("");
                }}
                maxLength={30}
                placeholder="Seu nome"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-retro text-xl text-white outline-none transition focus:border-cyan-400"
              />

              <button
                type="button"
                onClick={sortearNome}
                className="rounded-xl border border-white/10 px-4 font-pixel text-[8px] text-cyan-300 transition hover:border-cyan-400 hover:text-white"
              >
                SORTEAR
              </button>
            </div>

            <p className="mt-2 font-retro text-sm text-slate-600">
              Seu nome aparece nas salas, avaliações,
              rankings e no perfil público.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-2xl">
            <div className="mb-3 flex items-center justify-between">
              <label className="font-pixel text-[9px] text-cyan-300">
                SEU AVATAR
              </label>

              <button
                type="button"
                onClick={sortearAvatar}
                className="font-retro text-base text-pink-400 transition hover:text-white"
              >
                🎲 Sortear avatar
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {AVATARS.map((item) => {
                const active = avatar === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setAvatar(item);
                      setSaved(false);
                      setError("");
                    }}
                    aria-label={`Escolher avatar ${item}`}
                    className={[
                      "aspect-square rounded-xl border text-2xl transition sm:text-3xl",
                      active
                        ? "scale-105 border-pink-400 bg-pink-500/15 shadow-[0_0_18px_rgba(255,0,127,0.12)]"
                        : "border-white/10 bg-white/[0.03] hover:border-cyan-400/40 hover:bg-cyan-400/5",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center font-retro text-base text-red-300">
              {error}
            </div>
          )}

          {saved && (
            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center font-retro text-base text-cyan-300">
              ✓ Perfil atualizado com sucesso!
            </div>
          )}

          <div className="mx-auto mt-6 max-w-2xl">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-pink-500 px-5 py-4 font-pixel text-[10px] text-white shadow-[0_0_30px_rgba(255,0,127,.25)] transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />

              {saving
                ? "SALVANDO..."
                : "SALVAR ALTERAÇÕES"}
            </button>
          </div>
        </section>
      </section>
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
        "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 font-pixel text-[9px] transition",
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
