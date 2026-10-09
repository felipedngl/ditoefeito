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
  getUserProfile,
  randomAvatar,
  saveUserProfile,
  slugifyUsername,
  subscribeToAuth,
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

  /*
   * O modo e o código agora vêm diretamente da URL.
   *
   * Exemplo:
   *
   * /configurar?mode=couple&code=A7K92P
   *
   * Não usamos sessionStorage.
   */

  const requestedMode =
    searchParams.get("mode");

  const urlRoomCode =
    (searchParams.get("code") || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);

  const [mode, setMode] =
    useState<ProfileMode>(
      requestedMode === "couple"
        ? "couple"
        : requestedMode === "group"
          ? "group"
          : "solo"
    );

  const [username, setUsername] =
    useState("");

  const [avatar, setAvatar] =
    useState("");

  const [spaceName, setSpaceName] =
    useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAuth(
      async (user) => {
        if (!user) {
          return;
        }

        try {
          const savedProfile =
            await getUserProfile(user.uid);

          if (!savedProfile) {
            return;
          }

          setUsername(savedProfile.username || "");
          setAvatar(savedProfile.avatar || "");
        } catch (err) {
          console.error(
            "Não foi possível carregar o perfil salvo:",
            err
          );
        }
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * Se veio de um convite, o código já
   * fica preenchido pela URL.
   *
   * Se não veio de convite, começa vazio
   * e o usuário pode digitar um código.
   */
  const [roomCode, setRoomCode] =
    useState(urlRoomCode);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  function changeMode(
    nextMode: ProfileMode
  ) {
    setMode(nextMode);
    setError("");

    if (nextMode === "solo") {
      setSpaceName("");
      setRoomCode("");
    }
  }

  function sortearNome() {
    setUsername(
      createUsername()
    );

    setError("");
  }

  function sortearAvatar() {
    setAvatar(
      randomAvatar()
    );

    setError("");
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

    setError("");
  }

  async function handleContinue() {
    setError("");

    const cleanUsername =
      username.trim();

    const cleanRoomCode =
      roomCode.trim().toUpperCase();

    const cleanSpaceName =
      spaceName.trim();

    /*
     * =====================================================
     * VALIDAÇÕES DO PERFIL
     * =====================================================
     */

    if (!cleanUsername) {
      setError(
        "Digite seu nome de perfil para continuar."
      );

      return;
    }

    if (!avatar) {
      setError(
        "Escolha um avatar para continuar."
      );

      return;
    }

    /*
     * =====================================================
     * MODO SOZINHO
     * =====================================================
     */

    if (mode === "solo") {
      try {
        setSaving(true);

        const user =
          await ensureAnonymousUser();

        const profile = {
          username:
            cleanUsername,

          usernameSlug:
            slugifyUsername(
              cleanUsername
            ),

          avatar,

          mode,

          spaceName: "",
        };

        /*
         * O perfil é salvo no Firestore.
         *
         * Não precisamos guardar uma cópia
         * no sessionStorage.
         */
        await saveUserProfile(
          user,
          profile
        );

        router.push(
          "/filmes"
        );
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

    /*
     * =====================================================
     * VALIDAÇÃO DO CÓDIGO
     * =====================================================
     */

    if (
      cleanRoomCode &&
      cleanRoomCode.length !== 6
    ) {
      setError(
        "O código da sala deve ter 6 caracteres."
      );

      return;
    }

    /*
     * =====================================================
     * ENTRAR EM SALA EXISTENTE
     * =====================================================
     *
     * Se existe código:
     *
     * 1. Procuramos a sala no Firestore.
     * 2. Pegamos o modo/nome da sala do anfitrião.
     * 3. Salvamos o perfil do convidado.
     * 4. Criamos o pedido de entrada.
     * 5. Levamos o convidado para o lobby.
     *
     * Nenhuma dessas informações depende
     * de sessionStorage.
     */

    if (cleanRoomCode) {
      try {
        setSaving(true);

        const user =
          await ensureAnonymousUser();

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
         * O modo verdadeiro sempre vem
         * da sala criada pelo anfitrião.
         */
        const joinedMode: ProfileMode =
          existingSpace.mode ===
          "group"
            ? "group"
            : "couple";

        const profile = {
          username:
            cleanUsername,

          usernameSlug:
            slugifyUsername(
              cleanUsername
            ),

          avatar,

          mode:
            joinedMode,

          spaceName:
            existingSpace.name,
        };

        /*
         * Salva o perfil no Firestore.
         */
        await saveUserProfile(
          user,
          profile
        );

        /*
         * Cria o pedido de entrada
         * diretamente no Firestore.
         */
        const result =
          await requestToJoinSpace({
            space:
              existingSpace,

            uid:
              user.uid,

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

        /*
         * O lobby agora recebe o ID da sala
         * pela própria URL.
         *
         * Não precisamos guardar a sala
         * em nenhum armazenamento local.
         */
        router.push(
          `/sala/${existingSpace.id}`
        );

        return;
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível entrar na sala agora."
        );
      } finally {
        setSaving(false);
      }

      return;
    }

    /*
     * =====================================================
     * CRIAR NOVA SALA
     * =====================================================
     *
     * Sem código:
     *
     * → usuário está criando uma nova sala.
     */

    if (!cleanSpaceName) {
      setError(
        "Digite o nome da sala ou grupo para continuar."
      );

      return;
    }

    try {
      setSaving(true);

      const user =
        await ensureAnonymousUser();

      const profile = {
        username:
          cleanUsername,

        usernameSlug:
          slugifyUsername(
            cleanUsername
          ),

        avatar,

        mode,

        spaceName:
          cleanSpaceName,
      };

      /*
       * Salva o perfil no Firestore.
       */
      await saveUserProfile(
        user,
        profile
      );

      /*
       * Cria a sala no Firestore.
       *
       * O próprio createSpace também
       * cria o anfitrião como membro.
       */
      const space =
        await createSpace({
          hostUid:
            user.uid,

          hostUsername:
            cleanUsername,

          hostAvatar:
            avatar,

          name:
            cleanSpaceName,

          mode:
            mode === "group"
              ? "group"
              : "couple",
        });

      /*
       * A sala é identificada pelo ID
       * que vem do Firestore.
       *
       * Não salvamos esse ID localmente.
       */
      router.push(
        `/sala/${space.id}`
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar essa sala agora."
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
              ].map(
                (item) => {
                  const active =
                    mode ===
                    item.id;

                  return (
                    <button
                      key={
                        item.id
                      }
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
                        {
                          item.icon
                        }
                      </div>

                      <div className="mt-4 font-pixel text-[10px] text-white">
                        {
                          item.title
                        }
                      </div>

                      <div className="mt-2 text-sm text-slate-400">
                        {
                          item.text
                        }
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* NOME */}

          <div className="mt-8">
            <label className="mb-3 block font-pixel text-[10px] text-cyan-300">
              SEU NOME
              <span className="ml-2 text-pink-400">
                *
              </span>
            </label>

            <div className="flex gap-2">
              <input
                value={
                  username
                }
                onChange={(
                  event
                ) =>
                  setUsername(
                    event.target
                      .value
                  )
                }
                maxLength={
                  30
                }
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-lg text-white outline-none transition focus:border-cyan-400"
                placeholder="Digite seu nome"
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

            <p className="mt-2 text-sm text-slate-500">
              Esse será o nome que
              os outros
              participantes verão
              na sessão.
            </p>
          </div>

          {/* AVATAR */}

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <label className="font-pixel text-[10px] text-cyan-300">
                SEU AVATAR
                <span className="ml-2 text-pink-400">
                  *
                </span>
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
                    avatar ===
                    item;

                  return (
                    <button
                      key={
                        item
                      }
                      type="button"
                      onClick={() =>
                        setAvatar(
                          item
                        )
                      }
                      className={`aspect-square rounded-xl border text-2xl transition ${
                        active
                          ? "scale-105 border-pink-400 bg-pink-500/15"
                          : "border-white/10 bg-white/[.03] hover:border-cyan-400/40"
                      }`}
                    >
                      {
                        item
                      }
                    </button>
                  );
                }
              )}
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Escolha um avatar
              para representar
              você na sessão.
            </p>
          </div>

          {/* NOME DA SALA */}

          {mode !== "solo" && (
            <div className="mt-8">
              <label className="mb-3 block font-pixel text-[10px] text-cyan-300">
                NOME DA SALA / GRUPO
                {!roomCode.trim() && (
                  <span className="ml-2 text-pink-400">
                    *
                  </span>
                )}
              </label>

              <input
                value={
                  spaceName
                }
                onChange={(
                  event
                ) =>
                  setSpaceName(
                    event.target
                      .value
                  )
                }
                maxLength={
                  40
                }
                disabled={Boolean(
                  roomCode.trim()
                )}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-lg text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={
                  mode ===
                  "couple"
                    ? "Ex.: Sessão da Sexta"
                    : "Ex.: Turma do Cinema"
                }
              />

              <p className="mt-2 text-sm text-slate-500">
                {roomCode.trim()
                  ? "Você está entrando em uma sala existente. O nome dela já pertence ao anfitrião."
                  : "Dê um nome para sua sessão antes de compartilhar o convite."}
              </p>

              {/* CÓDIGO DA SALA */}

              <div className="mt-6">
                <label className="mb-3 block font-pixel text-[10px] text-pink-300">
                  CÓDIGO DA SALA
                </label>

                <input
                  value={
                    roomCode
                  }
                  onChange={(
                    event
                  ) =>
                    handleRoomCodeChange(
                      event.target
                        .value
                    )
                  }
                  maxLength={
                    6
                  }
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={
                    false
                  }
                  className="w-full rounded-xl border border-pink-400/20 bg-black/30 px-4 py-4 text-center font-pixel text-lg tracking-[0.35em] text-white uppercase outline-none transition focus:border-pink-400"
                  placeholder="EX.: A7K92P"
                />

                <p className="mt-2 text-sm text-slate-500">
                  Se você recebeu um
                  código, coloque
                  aqui para entrar
                  na sala de outra
                  pessoa. Se não
                  recebeu, deixe
                  vazio para criar
                  uma nova sala.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {
                error
              }
            </div>
          )}

          <button
            type="button"
            onClick={
              handleContinue
            }
            disabled={
              saving
            }
            className="mt-8 w-full rounded-xl bg-pink-500 px-5 py-4 font-pixel text-xs text-white shadow-[0_0_30px_rgba(255,0,127,.25)] transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "PREPARANDO..."
              : mode ===
                  "solo"
                ? "ENTRAR NO CINEMA →"
                : roomCode.trim()
                  ? "ENTRAR NA SALA →"
                  : "CRIAR SALA →"}
          </button>

          {mode !== "solo" && (
            <div className="mt-4 text-center font-retro text-sm text-slate-600">
              Tem um código? Entre
              na sala existente.
              Não tem? Deixe o
              código vazio e crie
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
