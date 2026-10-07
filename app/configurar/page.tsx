"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  AVATARS,
  createUsername,
  ensureAnonymousUser,
  randomAvatar,
  saveUserProfile,
  slugifyUsername,
  type ProfileMode,
} from "@/lib/auth";

import {
  createSpace,
  findWaitingSpaceByCode,
  requestToJoinSpace,
} from "@/lib/spaces";

function ConfigurarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedMode = searchParams.get("mode");

  const [mode, setMode] = useState<ProfileMode>(
    requestedMode === "couple"
      ? "couple"
      : requestedMode === "group"
        ? "group"
        : "solo"
  );

  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [spaceName, setSpaceName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setUsername(createUsername());
    setAvatar(randomAvatar());

    const savedCode =
      sessionStorage.getItem("ditoefeito_join_code");

    if (savedCode) {
      setRoomCode(
        savedCode
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 6)
      );

      sessionStorage.removeItem(
        "ditoefeito_join_code"
      );
    }
  }, []);

  function changeMode(nextMode: ProfileMode) {
    setMode(nextMode);
    setError("");

    if (nextMode === "solo") {
      setSpaceName("");
      setRoomCode("");
    }
  }

  function sortearNome() {
    setUsername(createUsername());
  }

  function sortearAvatar() {
    setAvatar(randomAvatar());
  }

  function handleRoomCodeChange(
    value: string
  ) {
    setRoomCode(
      value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6)
    );
  }

  async function handleContinue() {
    setError("");

    const cleanUsername =
      username.trim();

    const cleanRoomCode =
      roomCode.trim().toUpperCase();

    const cleanSpaceName =
      spaceName.trim();

    if (!cleanUsername) {
      setError(
        "Escolha um nome para continuar."
      );
      return;
    }

    if (!avatar) {
      setError(
        "Escolha um avatar para continuar."
      );
      return;
    }

    if (
      mode === "solo"
    ) {
      try {
        setSaving(true);

        const user =
          await ensureAnonymousUser();

        const profile = {
          username: cleanUsername,
          usernameSlug:
            slugifyUsername(
              cleanUsername
            ),
          avatar,
          mode,
          spaceName: "",
        };

        await saveUserProfile(
          user,
          profile
        );

        sessionStorage.setItem(
          "ditoefeito_profile",
          JSON.stringify(profile)
        );

        sessionStorage.removeItem(
          "ditoefeito_space"
        );

        sessionStorage.removeItem(
          "ditoefeito_active_space"
        );

        router.push("/filmes");
      } catch (err) {
        console.error(err);

        setError(
          "Não foi possível entrar agora. Tente novamente."
        );
      } finally {
        setSaving(false);
      }

      return;
    }

    if (
      cleanRoomCode &&
      cleanRoomCode.length !== 6
    ) {
      setError(
        "O código da sala deve ter 6 caracteres."
      );
      return;
    }

    if (
      !cleanRoomCode &&
      !cleanSpaceName
    ) {
      setError(
        "Digite o nome da sala ou informe um código para entrar em uma sala existente."
      );
      return;
    }

    try {
      setSaving(true);

      const user =
        await ensureAnonymousUser();

      /*
       * =====================================================
       * ENTRAR EM SALA EXISTENTE
       * =====================================================
       */

      if (cleanRoomCode) {
        const existingSpace =
          await findWaitingSpaceByCode(
            cleanRoomCode
          );

        if (!existingSpace) {
          setError(
            "Não encontramos uma sala aberta com esse código."
          );
          return;
        }

        /*
         * O modo vem da sala do anfitrião.
         * O convidado não cria uma segunda sala.
         */
        const joinedMode: ProfileMode =
          existingSpace.mode ===
          "group"
            ? "group"
            : "couple";

        const profile = {
          username: cleanUsername,
          usernameSlug:
            slugifyUsername(
              cleanUsername
            ),
          avatar,
          mode: joinedMode,
          spaceName:
            existingSpace.name,
        };

        await saveUserProfile(
          user,
          profile
        );

        sessionStorage.setItem(
          "ditoefeito_profile",
          JSON.stringify(profile)
        );

        /*
         * Envia pedido para o anfitrião.
         * NÃO entra diretamente.
         */
        const result =
          await requestToJoinSpace({
            space: existingSpace,
            uid: user.uid,
            username:
              cleanUsername,
            avatar,
          });

        if (result === "full") {
          setError(
            "Essa sala já está cheia."
          );
          return;
        }

        sessionStorage.setItem(
          "ditoefeito_space",
          JSON.stringify(
            existingSpace
          )
        );

        sessionStorage.setItem(
          "ditoefeito_active_space",
          JSON.stringify(
            existingSpace
          )
        );

        /*
         * Vai para o lobby.
         * O lobby fica aguardando o host.
         */
        router.push(
          `/sala/${existingSpace.id}`
        );

        return;
      }

      /*
       * =====================================================
       * CRIAR NOVA SALA
       * =====================================================
       */

      const profile = {
        username: cleanUsername,
        usernameSlug:
          slugifyUsername(
            cleanUsername
          ),
        avatar,
        mode,
        spaceName:
          cleanSpaceName,
      };

      await saveUserProfile(
        user,
        profile
      );

      sessionStorage.setItem(
        "ditoefeito_profile",
        JSON.stringify(profile)
      );

      const space =
        await createSpace({
          hostUid: user.uid,
          hostUsername:
            cleanUsername,
          hostAvatar: avatar,
          name:
            cleanSpaceName,
          mode:
            mode === "group"
              ? "group"
              : "couple",
        });

      sessionStorage.setItem(
        "ditoefeito_space",
        JSON.stringify(space)
      );

      sessionStorage.setItem(
        "ditoefeito_active_space",
        JSON.stringify(space)
      );

      /*
       * O anfitrião também passa pelo lobby.
       */
      router.push(
        `/sala/${space.id}`
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir essa etapa agora."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="retro-grid min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
          className="mb-8 font-pixel text-xs text-cyan-300 transition hover:text-white"
        >
          ← VOLTAR
        </button>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur md:p-10">

          <div className="text-center">
            <div className="mb-3 font-pixel text-xs text-pink-400">
              DITO & FEITO
            </div>

            <h1 className="font-pixel text-xl leading-relaxed text-white md:text-2xl">
              CONFIGURE SEU PERFIL
            </h1>

            <p className="mt-4 text-lg text-slate-400">
              Escolha seu nome, avatar e
              entre ou crie uma sessão.
            </p>
          </div>

          {/* MODO */}

          <div className="mt-10">
            <label className="mb-3 block font-pixel text-[10px] text-cyan-300">
              COMO VOCÊ VAI JOGAR?
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  id: "solo" as ProfileMode,
                  title: "SOZINHO",
                  text: "Sua biblioteca pessoal.",
                  icon: "👤",
                },
                {
                  id: "couple" as ProfileMode,
                  title: "CASALZINHO",
                  text: "Você + 1 pessoa.",
                  icon: "💞",
                },
                {
                  id: "group" as ProfileMode,
                  title: "GRUPINHO",
                  text: "De 3 até 10 pessoas.",
                  icon: "👾",
                },
              ].map((item) => {
                const active =
                  mode === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      changeMode(
                        item.id
                      )
                    }
                    className={`rounded-2xl border p-5 text-left transition ${
                      active
                        ? "border-pink-400 bg-pink-500/10 shadow-[0_0_25px_rgba(255,0,127,.15)]"
                        : "border-white/10 bg-white/[.03] hover:border-cyan-400/40"
                    }`}
                  >
                    <div className="text-3xl">
                      {item.icon}
                    </div>

                    <div className="mt-4 font-pixel text-[10px] text-white">
                      {item.title}
                    </div>

                    <div className="mt-2 text-sm text-slate-400">
                      {item.text}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* NOME */}

          <div className="mt-8">
            <label className="mb-3 block font-pixel text-[10px] text-cyan-300">
              SEU NOME
            </label>

            <div className="flex gap-2">
              <input
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                maxLength={30}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-lg text-white outline-none transition focus:border-cyan-400"
                placeholder="Seu nome"
              />

              <button
                type="button"
                onClick={
                  sortearNome
                }
                className="rounded-xl border border-white/10 px-4 text-sm text-cyan-300 transition hover:border-cyan-400 hover:text-white"
              >
                SORTEAR
              </button>
            </div>
          </div>

          {/* AVATAR */}

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <label className="font-pixel text-[10px] text-cyan-300">
                SEU AVATAR
              </label>

              <button
                type="button"
                onClick={
                  sortearAvatar
                }
                className="text-sm text-pink-400 hover:text-white"
              >
                🎲 Sortear
              </button>
            </div>

            <div className="grid grid-cols-8 gap-2">
              {AVATARS.map(
                (item) => {
                  const active =
                    avatar === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setAvatar(item)
                      }
                      className={`aspect-square rounded-xl border text-2xl transition ${
                        active
                          ? "scale-105 border-pink-400 bg-pink-500/15"
                          : "border-white/10 bg-white/[.03] hover:border-cyan-400/40"
                      }`}
                    >
                      {item}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* NOME DA SALA */}

          {mode !== "solo" && (
            <div className="mt-8">
              <label className="mb-3 block font-pixel text-[10px] text-cyan-300">
                NOME DA SALA
              </label>

              <input
                value={spaceName}
                onChange={(event) =>
                  setSpaceName(
                    event.target.value
                  )
                }
                maxLength={40}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-lg text-white outline-none transition focus:border-cyan-400"
                placeholder={
                  mode === "couple"
                    ? "Ex.: Sessão da Sexta"
                    : "Ex.: Turma do Cinema"
                }
              />

              <p className="mt-2 text-sm text-slate-500">
                Se você estiver criando
                uma sala, dê um nome para
                ela.
              </p>

              {/* CÓDIGO DA SALA */}

              <div className="mt-6">
                <label className="mb-3 block font-pixel text-[10px] text-pink-300">
                  CÓDIGO DA SALA
                </label>

                <input
                  value={roomCode}
                  onChange={(event) =>
                    handleRoomCodeChange(
                      event.target.value
                    )
                  }
                  maxLength={6}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-pink-400/20 bg-black/30 px-4 py-4 text-center font-pixel text-lg tracking-[0.35em] text-white uppercase outline-none transition focus:border-pink-400"
                  placeholder="EX.: A7K92P"
                />

                <p className="mt-2 text-sm text-slate-500">
                  Se você recebeu um código,
                  coloque aqui para entrar
                  na sala de outra pessoa.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={
              handleContinue
            }
            disabled={saving}
            className="mt-8 w-full rounded-xl bg-pink-500 px-5 py-4 font-pixel text-xs text-white shadow-[0_0_30px_rgba(255,0,127,.25)] transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "PREPARANDO..."
              : mode === "solo"
                ? "ENTRAR NO CINEMA →"
                : roomCode.trim()
                  ? "ENTRAR NA SALA →"
                  : "CRIAR SALA →"}
          </button>

          {mode !== "solo" && (
            <div className="mt-4 text-center font-retro text-sm text-slate-600">
              Tem um código? Entre na
              sala existente. Não tem?
              Deixe o código vazio e crie
              uma nova sala.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function ConfigurarPage() {
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
      <ConfigurarContent />
    </Suspense>
  );
}
