"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Dices,
  Film,
  RefreshCw,
  Sparkles,
  Users,
  UserRound,
} from "lucide-react";

import {
  AVATARS,
  createUsername,
  ensureAnonymousUser,
  randomAvatar,
  saveUserProfile,
  slugifyUsername,
  type ProfileMode,
} from "@/lib/auth";

type ModeInfo = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const MODE_INFO: Record<ProfileMode, ModeInfo> = {
  solo: {
    title: "SOZINHO",
    description:
      "Sua sessão pessoal. Avalie filmes e séries no seu ritmo.",
    icon: <UserRound size={25} />,
  },

  couple: {
    title: "CASALZINHO",
    description:
      "Crie um espaço para você e mais uma pessoa.",
    icon: <Users size={25} />,
  },

  group: {
    title: "GRUPINHO",
    description:
      "Monte um grupo de 3 até 10 pessoas.",
    icon: <Sparkles size={25} />,
  },
};

function ConfigurarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [mode, setMode] = useState<ProfileMode>("solo");
  const [spaceName, setSpaceName] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const queryMode = searchParams.get("modo");

    if (
      queryMode === "solo" ||
      queryMode === "couple" ||
      queryMode === "group"
    ) {
      setMode(queryMode);
    }

    setUsername(createUsername());
    setAvatar(randomAvatar());
  }, [searchParams]);

  const usernamePreview = useMemo(
    () => slugifyUsername(username),
    [username]
  );

  function handleRandomAvatar() {
    setAvatar((current) => {
      let next = randomAvatar();

      while (AVATARS.length > 1 && next === current) {
        next = randomAvatar();
      }

      return next;
    });
  }

  function handleRandomUsername() {
    setUsername(createUsername());
  }

  async function handleContinue() {
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError("Escolha um nome para continuar.");
      return;
    }

    if (!usernamePreview) {
      setError("Escolha um nome válido.");
      return;
    }

    if (!avatar) {
      setError("Escolha um avatar.");
      return;
    }

    if (
      (mode === "couple" || mode === "group") &&
      !spaceName.trim()
    ) {
      setError("Digite um nome para o espaço.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const user = await ensureAnonymousUser();

      const profile = {
        username: cleanUsername,
        usernameSlug: usernamePreview,
        avatar,
        mode,
        spaceName:
          mode === "solo"
            ? ""
            : spaceName.trim(),
      };

      await saveUserProfile(user, profile);

      sessionStorage.setItem(
        "dito-feito-profile-draft",
        JSON.stringify(profile)
      );

      /*
       * Por enquanto todos entram na home de filmes.
       *
       * A sala de espera de casal/grupo entra no Commit 2.
       */
      router.push("/filmes");
    } catch (err) {
      console.error(err);
      setError(
        "Não foi possível salvar seu perfil. Tente novamente."
      );
      setSaving(false);
    }
  }

  const info = MODE_INFO[mode];

  return (
    <main className="retro-grid min-h-screen px-5 py-8">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center">
        <section className="w-full rounded-3xl border border-white/10 bg-[#101522]/95 p-6 shadow-[0_0_70px_rgba(0,0,0,0.5)] backdrop-blur sm:p-9">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center text-pink-400">
              <Film size={34} />
            </div>

            <h1 className="font-pixel text-xl text-white sm:text-2xl">
              CONFIGURE SEU PERFIL
            </h1>

            <p className="mt-4 font-retro text-xl text-slate-400">
              Primeiro montamos seu perfil. Depois você entra no cinema.
            </p>
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            {(Object.keys(MODE_INFO) as ProfileMode[]).map(
              (item) => {
                const selected = mode === item;
                const itemInfo = MODE_INFO[item];

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={[
                      "rounded-2xl border px-4 py-5 text-left transition",
                      selected
                        ? "border-pink-400/60 bg-pink-500/15 shadow-[0_0_25px_rgba(255,0,127,0.12)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20",
                    ].join(" ")}
                  >
                    <div
                      className={
                        selected
                          ? "mb-3 text-pink-300"
                          : "mb-3 text-slate-500"
                      }
                    >
                      {itemInfo.icon}
                    </div>

                    <div className="font-pixel text-[10px] text-white">
                      {itemInfo.title}
                    </div>

                    <div className="mt-2 font-retro text-lg leading-tight text-slate-400">
                      {itemInfo.description}
                    </div>
                  </button>
                );
              }
            )}
          </div>

          <div className="mb-7 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
            <div className="flex items-start gap-4">
              <div className="mt-1 text-cyan-300">
                {info.icon}
              </div>

              <div>
                <div className="font-pixel text-xs text-cyan-200">
                  {info.title}
                </div>

                <p className="mt-2 font-retro text-xl text-slate-300">
                  {info.description}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-7">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="font-pixel text-[10px] text-white">
                  SEU NOME
                </label>

                <button
                  type="button"
                  onClick={handleRandomUsername}
                  className="flex items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-2 font-retro text-lg text-purple-200 transition hover:border-purple-300 hover:bg-purple-500/20"
                >
                  <Dices size={16} />
                  Outro nome
                </button>
              </div>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                maxLength={30}
                className="w-full rounded-xl border border-white/10 bg-[#080b14] px-4 py-4 font-retro text-2xl text-white outline-none transition placeholder:text-slate-600 focus:border-pink-400/60"
              />

              <div className="mt-2 font-retro text-lg text-slate-500">
                Seu identificador: @{usernamePreview || "..."}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="font-pixel text-[10px] text-white">
                  ESCOLHA SEU AVATAR
                </label>

                <button
                  type="button"
                  onClick={handleRandomAvatar}
                  className="flex items-center gap-2 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 font-retro text-lg text-yellow-200 transition hover:border-yellow-300 hover:bg-yellow-400/20"
                >
                  <RefreshCw size={16} />
                  Sortear
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#080b14] p-4">
                <div className="mb-5 flex items-center justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-pink-400/40 bg-pink-500/10 text-6xl shadow-[0_0_35px_rgba(255,0,127,0.15)]">
                    {avatar}
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
                  {AVATARS.map((item) => {
                    const selected = avatar === item;

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setAvatar(item)}
                        aria-label={`Escolher avatar ${item}`}
                        className={[
                          "flex aspect-square items-center justify-center rounded-xl border text-2xl transition",
                          selected
                            ? "border-pink-400 bg-pink-500/20 shadow-[0_0_15px_rgba(255,0,127,0.2)]"
                            : "border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.08]",
                        ].join(" ")}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {mode !== "solo" && (
              <div>
                <label className="mb-3 block font-pixel text-[10px] text-white">
                  NOME DO ESPAÇO
                </label>

                <input
                  type="text"
                  value={spaceName}
                  onChange={(event) =>
                    setSpaceName(event.target.value)
                  }
                  maxLength={50}
                  placeholder={
                    mode === "couple"
                      ? "Ex.: Felipe & Ana"
                      : "Ex.: Galera da Sessão"
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#080b14] px-4 py-4 font-retro text-2xl text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                />

                <p className="mt-2 font-retro text-lg text-slate-500">
                  {mode === "couple"
                    ? "O espaço será usado por você e mais uma pessoa."
                    : "Você poderá convidar até 9 pessoas."}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center font-retro text-xl text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleContinue}
              disabled={saving}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-pink-300/50 bg-pink-500 px-6 py-5 font-pixel text-xs text-white shadow-[0_0_30px_rgba(255,0,127,0.25)] transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw
                    size={20}
                    className="animate-spin"
                  />
                  SALVANDO...
                </>
              ) : (
                <>
                  ENTRAR NO DITO & FEITO
                  <Sparkles size={20} />
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ConfigurarPage() {
  return (
    <Suspense
      fallback={
        <main className="retro-grid flex min-h-screen items-center justify-center">
          <div className="font-pixel text-sm text-pink-400">
            CARREGANDO...
          </div>
        </main>
      }
    >
      <ConfigurarContent />
    </Suspense>
  );
}
