"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  Gamepad2,
  LogIn,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";

import {
  createAccountWithEmail,
  ensureAnonymousUser,
  getUserProfile,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

      const user = await signInWithGoogle();
      const profile = await getUserProfile(user.uid);

      router.push(profile ? "/filmes" : "/configurar");
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

  async function handleEmailLogin() {
    try {
      setLoading(true);
      setError("");

      const user = await signInWithEmail(
        email,
        password
      );

      const profile = await getUserProfile(user.uid);

      router.push(profile ? "/filmes" : "/configurar");
    } catch (err) {
      console.error(err);

      setError(
        getAuthErrorMessage(err)
      );

      setLoading(false);
    }
  }

  async function handleCreateAccount() {
    try {
      setLoading(true);
      setError("");

      const user = await createAccountWithEmail(
        email,
        password
      );

      router.push("/configurar");
    } catch (err) {
      console.error(err);

      setError(
        getAuthErrorMessage(err)
      );

      setLoading(false);
    }
  }

  async function handleResetPassword() {
    try {
      setLoading(true);
      setError("");

      await resetPassword(email);

      setError(
        "E-mail de recuperação enviado. Confira sua caixa de entrada."
      );

      setLoading(false);
    } catch (err) {
      console.error(err);

      setError(
        getAuthErrorMessage(err)
      );

      setLoading(false);
    }
  }

  function resetEmailPanels() {
    setShowEmailLogin(false);
    setShowCreateAccount(false);
    setShowResetPassword(false);

    setEmail("");
    setPassword("");
    setError("");
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

          {!showEmailLogin &&
            !showCreateAccount &&
            !showResetPassword ? (
            <>
              <div className="mb-6 text-center">

                <p className="font-pixel text-sm text-yellow-300">
                  COMO VOCÊ QUER ENTRAR?
                </p>

                <p className="mt-3 font-retro text-xl text-slate-400">
                  Entre com sua conta ou comece como convidado.
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
                    Continuar com Google
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setShowEmailLogin(true);
                  }}
                  disabled={loading}
                  className="group flex min-h-[100px] flex-col items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-500/10 px-5 py-5 transition hover:border-purple-300 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogIn
                    size={28}
                    className="mb-2 text-purple-300 transition group-hover:scale-110"
                  />

                  <span className="font-pixel text-xs text-white">
                    ENTRAR COM E-MAIL
                  </span>

                  <span className="mt-2 font-retro text-lg text-purple-200">
                    E-mail e senha
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
                  onClick={() => {
                    setError("");
                    setShowCreateAccount(true);
                  }}
                  disabled={loading}
                  className="group flex min-h-[100px] flex-col items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-500/10 px-5 py-5 transition hover:border-yellow-300 hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles
                    size={28}
                    className="mb-2 text-yellow-300 transition group-hover:scale-110"
                  />

                  <span className="font-pixel text-xs text-white">
                    CRIAR CONTA
                  </span>

                  <span className="mt-2 font-retro text-lg text-yellow-200">
                    Usar e-mail
                  </span>
                </button>

              </div>
            </>
          ) : (
            <div>

              <button
                type="button"
                onClick={resetEmailPanels}
                className="mb-6 font-pixel text-[9px] text-slate-400 transition hover:text-white"
              >
                ← VOLTAR
              </button>

              {showEmailLogin && (
                <>
                  <div className="mb-6 text-center">

                    <p className="font-pixel text-sm text-purple-300">
                      ENTRAR COM E-MAIL
                    </p>

                    <p className="mt-3 font-retro text-xl text-slate-400">
                      Acesse sua conta do Dito & Feito.
                    </p>

                  </div>

                  <EmailForm
                    email={email}
                    password={password}
                    setEmail={setEmail}
                    setPassword={setPassword}
                    loading={loading}
                    buttonText="ENTRAR"
                    onSubmit={handleEmailLogin}
                  />

                  <div className="mt-5 flex flex-col items-center gap-3">

                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailLogin(false);
                        setShowResetPassword(true);
                        setError("");
                      }}
                      className="font-retro text-lg text-cyan-300 hover:text-cyan-200"
                    >
                      Esqueci minha senha
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailLogin(false);
                        setShowCreateAccount(true);
                        setError("");
                      }}
                      className="font-retro text-lg text-yellow-300 hover:text-yellow-200"
                    >
                      Ainda não tenho conta
                    </button>

                  </div>
                </>
              )}

              {showCreateAccount && (
                <>
                  <div className="mb-6 text-center">

                    <p className="font-pixel text-sm text-yellow-300">
                      CRIAR CONTA
                    </p>

                    <p className="mt-3 font-retro text-xl text-slate-400">
                      Crie sua conta para guardar tudo no seu perfil.
                    </p>

                  </div>

                  <EmailForm
                    email={email}
                    password={password}
                    setEmail={setEmail}
                    setPassword={setPassword}
                    loading={loading}
                    buttonText="CRIAR CONTA"
                    onSubmit={handleCreateAccount}
                  />

                  <p className="mt-4 text-center font-retro text-base text-slate-500">
                    Use uma senha com pelo menos 6 caracteres.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateAccount(false);
                      setShowEmailLogin(true);
                      setError("");
                    }}
                    className="mt-5 block w-full text-center font-retro text-lg text-cyan-300 hover:text-cyan-200"
                  >
                    Já tenho uma conta
                  </button>
                </>
              )}

              {showResetPassword && (
                <>
                  <div className="mb-6 text-center">

                    <p className="font-pixel text-sm text-cyan-300">
                      RECUPERAR SENHA
                    </p>

                    <p className="mt-3 font-retro text-xl text-slate-400">
                      Enviaremos um link para seu e-mail.
                    </p>

                  </div>

                  <div className="space-y-4">

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="Seu e-mail"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 font-retro text-lg text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                    />

                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={loading || !email.trim()}
                      className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 font-pixel text-[10px] text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ENVIAR RECUPERAÇÃO
                    </button>

                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPassword(false);
                      setShowEmailLogin(true);
                      setError("");
                    }}
                    className="mt-5 block w-full text-center font-retro text-lg text-purple-300 hover:text-purple-200"
                  >
                    Voltar para o login
                  </button>
                </>
              )}

            </div>
          )}

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

function EmailForm({
  email,
  password,
  setEmail,
  setPassword,
  loading,
  buttonText,
  onSubmit,
}: {
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  loading: boolean;
  buttonText: string;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">

      <input
        type="email"
        value={email}
        onChange={(event) =>
          setEmail(event.target.value)
        }
        placeholder="Seu e-mail"
        autoComplete="email"
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 font-retro text-lg text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/60"
      />

      <input
        type="password"
        value={password}
        onChange={(event) =>
          setPassword(event.target.value)
        }
        placeholder="Sua senha"
        autoComplete="current-password"
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 font-retro text-lg text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/60"
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={
          loading ||
          !email.trim() ||
          !password
        }
        className="w-full rounded-xl border border-purple-400/30 bg-purple-500/10 px-5 py-4 font-pixel text-[10px] text-purple-200 transition hover:border-purple-300 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buttonText}
      </button>

    </div>
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

function getAuthErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code = (error as { code?: string }).code;

    switch (code) {
      case "auth/invalid-credential":
        return "E-mail ou senha incorretos.";

      case "auth/invalid-email":
        return "Digite um e-mail válido.";

      case "auth/email-already-in-use":
        return "Este e-mail já possui uma conta.";

      case "auth/weak-password":
        return "A senha precisa ter pelo menos 6 caracteres.";

      case "auth/user-not-found":
        return "Não encontramos uma conta com este e-mail.";

      case "auth/wrong-password":
        return "E-mail ou senha incorretos.";

      case "auth/too-many-requests":
        return "Muitas tentativas. Tente novamente mais tarde.";

      default:
        return "Não foi possível concluir esta operação.";
    }
  }

  return "Não foi possível concluir esta operação.";
}
