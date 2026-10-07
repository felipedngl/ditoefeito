"use client";

import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Film,
  Save,
  Trophy,
  UserRound,
  Copy,
  ExternalLink,
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

export default function PerfilPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

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

    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const user = auth.currentUser;

      if (!user) {
        throw new Error("Usuário não autenticado.");
      }

      const newSlug = slugifyUsername(cleanUsername);

      await saveUserProfile(user, {
        username: cleanUsername,
        usernameSlug: newSlug,
        avatar,

        /*
         * O modo continua sendo preservado para
         * a lógica das salas.
         *
         * A sala NÃO faz mais parte da interface
         * pública do perfil.
         */
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
      }, 2000);
    } catch (error) {
      console.error(
        "Não foi possível copiar o link:",
        error
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
          CARREGANDO...
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

  return (
    <main className="retro-grid min-h-screen px-5 pb-16">
      <div className="mx-auto w-full max-w-5xl">

        {/* HEADER */}

        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 py-6">

          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
            aria-label="Voltar para o início"
          >
            <img
              src="/logo.png"
              alt="Dito & Feito"
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          </button>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-pink-400/30 bg-pink-500/10 text-2xl">
              {avatar}
            </div>

            <div className="hidden text-left sm:block">
              <div className="font-pixel text-[10px] text-white">
                {username}
              </div>

              <div className="font-retro text-lg text-slate-500">
                @{profileSlug}
              </div>
            </div>

          </div>
        </header>

        {/* NAVEGAÇÃO */}

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-2">

          <NavButton
            icon={<Film size={17} />}
            label="Catálogo"
            onClick={() =>
              router.push("/filmes")
            }
          />

          <NavButton
            icon={<BookOpen size={17} />}
            label="Biblioteca"
            onClick={() =>
              router.push("/filmes/biblioteca")
            }
          />

          <NavButton
            icon={<Trophy size={17} />}
            label="Pódio"
            onClick={() =>
              router.push("/filmes/podio")
            }
          />

          <NavButton
            icon={<UserRound size={17} />}
            label="Perfil"
            active
            onClick={() =>
              router.push("/perfil")
            }
          />

        </nav>

        {/* TÍTULO */}

        <section className="mt-12 text-center">

          <div className="flex items-center justify-center gap-3">

            <UserRound
              size={25}
              className="text-pink-400"
            />

            <p className="font-pixel text-xs text-pink-400">
              SUA IDENTIDADE
            </p>

          </div>

          <h1 className="mt-5 font-pixel text-2xl leading-relaxed text-white sm:text-4xl">
            MEU PERFIL
          </h1>

          <p className="mx-auto mt-4 max-w-2xl font-retro text-2xl text-slate-400">
            Seu perfil público no Dito & Feito.
          </p>

        </section>

        {/* PERFIL PÚBLICO */}

        <section className="mt-10 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur sm:p-10">

          <div className="flex flex-col items-center">

            <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-pink-400/40 bg-pink-500/10 text-7xl shadow-[0_0_50px_rgba(255,0,127,0.12)]">
              {avatar}
            </div>

            <h2 className="mt-5 font-pixel text-xl text-white">
              {username}
            </h2>

            <div className="mt-2 font-retro text-xl text-slate-500">
              @{profileSlug}
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">

              <button
                type="button"
                onClick={openPublicProfile}
                className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 font-pixel text-[9px] text-cyan-300 transition hover:border-cyan-300 hover:text-white"
              >
                <ExternalLink size={15} />
                VER PERFIL PÚBLICO
              </button>

              <button
                type="button"
                onClick={copyProfileLink}
                className="flex items-center gap-2 rounded-xl border border-pink-400/30 bg-pink-500/10 px-4 py-3 font-pixel text-[9px] text-pink-300 transition hover:border-pink-300 hover:text-white"
              >
                <Copy size={15} />
                {copied
                  ? "LINK COPIADO!"
                  : "COMPARTILHAR PERFIL"}
              </button>

            </div>

          </div>

          {/* NOME */}

          <div className="mx-auto mt-10 max-w-2xl">

            <label className="mb-3 block font-pixel text-[10px] text-cyan-300">
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
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-4 font-retro text-2xl text-white outline-none transition focus:border-cyan-400"
              />

              <button
                type="button"
                onClick={sortearNome}
                className="rounded-xl border border-white/10 px-4 text-sm text-cyan-300 transition hover:border-cyan-400 hover:text-white"
              >
                SORTEAR
              </button>

            </div>

            <p className="mt-2 font-retro text-base text-slate-600">
              Seu nome aparece nas salas,
              avaliações, rankings e no seu perfil público.
            </p>

          </div>

          {/* AVATARES */}

          <div className="mx-auto mt-10 max-w-2xl">

            <div className="mb-3 flex items-center justify-between">

              <label className="font-pixel text-[10px] text-cyan-300">
                SEU AVATAR
              </label>

              <button
                type="button"
                onClick={sortearAvatar}
                className="font-retro text-lg text-pink-400 transition hover:text-white"
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

          {/* LINK PÚBLICO */}

          <div className="mx-auto mt-10 max-w-2xl">

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">

              <div className="font-pixel text-[9px] text-cyan-300">
                SEU PERFIL PÚBLICO
              </div>

              <div className="mt-3 break-all font-retro text-lg text-white">
                /perfil/{profileSlug}
              </div>

              <p className="mt-2 font-retro text-base text-slate-500">
                Compartilhe esse endereço para outras pessoas
                conhecerem sua biblioteca e suas avaliações.
              </p>

            </div>

          </div>

          {/* ERRO */}

          {error && (
            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center font-retro text-lg text-red-300">
              {error}
            </div>
          )}

          {/* SUCESSO */}

          {saved && (
            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center font-retro text-lg text-cyan-300">
              ✓ Perfil atualizado com sucesso!
            </div>
          )}

          {/* SALVAR */}

          <div className="mx-auto mt-8 max-w-2xl">

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-pink-500 px-5 py-4 font-pixel text-xs text-white shadow-[0_0_30px_rgba(255,0,127,.25)] transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={18} />

              {saving
                ? "SALVANDO..."
                : "SALVAR ALTERAÇÕES"}
            </button>

          </div>

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
