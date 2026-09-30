"use client";

import React, { useState, useEffect } from "react";
import { Search, User, Users, Trophy, Sparkles, Star, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TabType = "solo" | "duo" | "podio";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("solo");
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroFinished(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // API pública gratuita de busca TMDB
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=15d2aea6854d7e8264571c22b035329d&language=pt-BR&query=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await res.json();
      if (data.results) {
        setMovies(data.results);
      }
    } catch (err) {
      console.error("Erro ao buscar filmes:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#080c14] text-slate-100 max-w-5xl mx-auto px-4 py-8">
      {/* Intro / Splash Screen */}
      <AnimatePresence>
        {!introFinished && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIntroFinished(true)}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090d16] cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 text-center px-4"
            >
              <h1 className="text-3xl md:text-5xl font-pixel text-pink-500 text-glow-pink tracking-wider">
                DITO & FEITO
              </h1>
              <p className="font-pixel text-xs text-cyan-400 text-glow-blue tracking-widest mt-4 animate-pulse">
                PRESS START / TOQUE PARA CONTINUAR
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conteúdo Principal */}
      <div className="relative z-10 space-y-8">
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border border-pink-500/30 bg-slate-950/80 p-6 rounded-3xl box-glow-pink">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-pixel text-pink-500 text-glow-pink">
              DITO & FEITO
            </h1>
            <p className="text-cyan-400 font-retro text-xl tracking-widest text-glow-blue mt-1">
              ★ SESSÃO DISCO & AVALIAÇÕES RETRO ★
            </p>
          </div>

          {/* Abas Navegação */}
          <nav className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-pink-500/30 gap-1">
            {[
              { id: "solo", label: "SOLO", icon: User },
              { id: "duo", label: "DUO/GRUPO", icon: Users },
              { id: "podio", label: "PÓDIO", icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-pixel transition-all ${
                    isActive
                      ? "bg-pink-500 text-slate-950 font-bold box-glow-pink"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Conteúdo das Abas */}
        {activeTab === "solo" && (
          <section className="space-y-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-pink-400" />
                <input
                  type="text"
                  placeholder="Digite o nome do filme (ex: Pulp Fiction, Matrix)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-pink-500/40 rounded-2xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:box-glow-pink transition-all font-retro text-xl"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-500 text-white font-pixel text-xs px-6 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 box-glow-pink btn-neon-hover"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                BUSCAR
              </button>
            </form>

            {/* Lista de Filmes Buscados */}
            {movies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl overflow-hidden p-4 flex flex-col justify-between box-glow-blue hover:border-cyan-400 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 font-pixel text-xs">
                            SEM CAPA
                          </div>
                        )}
                      </div>
                      <h3 className="font-pixel text-sm text-pink-400 line-clamp-1">{movie.title}</h3>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                        <span>{movie.release_date?.split("-")[0] || "N/A"}</span>
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-3.5 h-3.5 fill-yellow-400" />
                          {movie.vote_average?.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs line-clamp-3 font-sans">
                        {movie.overview || "Sem sinopse disponível."}
                      </p>
                    </div>
                    <button className="mt-4 w-full bg-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/40 font-pixel text-[10px] py-2.5 rounded-xl transition-all">
                      AVALIAR FILME
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/80 box-glow-blue rounded-3xl p-10 text-center space-y-3 border border-cyan-500/30">
                <Sparkles className="w-10 h-10 mx-auto text-cyan-400 animate-pulse" />
                <p className="text-cyan-300 font-retro text-2xl tracking-wider">
                  PESQUISE UM TÍTULO PARA COMEÇAR
                </p>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Digite o nome de qualquer filme no campo acima e clique em BUSCAR.
                </p>
              </div>
            )}
          </section>
        )}

        {activeTab === "duo" && (
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-950/80 box-glow-pink p-6 rounded-3xl border border-pink-500/30 space-y-4">
              <h2 className="text-xl font-pixel text-pink-400">CRIAR SALA</h2>
              <p className="text-slate-400 text-xs">
                Crie uma sala privada para votar em filmes juntos.
              </p>
              <button className="w-full bg-pink-600 hover:bg-pink-500 text-white font-pixel text-xs py-3.5 rounded-xl box-glow-pink transition-all">
                GERAR CÓDIGO
              </button>
            </div>

            <div className="bg-slate-950/80 box-glow-blue p-6 rounded-3xl border border-cyan-500/30 space-y-4">
              <h2 className="text-xl font-pixel text-cyan-400">ENTRAR EM SALA</h2>
              <p className="text-slate-400 text-xs">Digite o código gerado pela outra pessoa.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="EX: DISCO-80"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono text-slate-100 uppercase focus:outline-none focus:border-cyan-500 text-xs"
                />
                <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-pixel text-xs px-5 py-2.5 rounded-xl transition-all">
                  ENTRAR
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "podio" && (
          <section className="bg-slate-950/80 box-glow-blue rounded-3xl p-10 text-center space-y-4 border border-cyan-500/30">
            <Trophy className="w-14 h-14 text-yellow-400 mx-auto animate-bounce" />
            <h2 className="text-2xl font-pixel text-yellow-400">PÓDIO DA SESSÃO</h2>
            <p className="text-slate-400 font-retro text-xl max-w-md mx-auto">
              OS FILMES MAIS BEM AVALIADOS APARECERÃO AQUI EM 1º, 2º E 3º LUGAR!
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
