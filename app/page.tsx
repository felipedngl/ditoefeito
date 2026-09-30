"use client";

import React, { useState, useEffect } from "react";
import { Search, User, Users, Trophy, Sparkles, Star, Loader2, Film } from "lucide-react";

// === COLE SUA CHAVE DO TMDB NA LINHA ABAIXO ===
const TMDB_API_KEY = "f387a8d39e74287934d786c1f2c2fe57"; 

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

  // Busca automática ao digitar pelo menos 3 letras
  useEffect(() => {
    const fetchMovies = async () => {
      if (searchQuery.trim().length < 3) {
        setMovies([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(
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

    const timeoutId = setTimeout(() => {
      fetchMovies();
    }, 350); // Aguarda 350ms após parar de digitar

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border border-pink-500/40 bg-slate-900/90 p-6 rounded-3xl box-glow-pink">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-pixel text-pink-500 text-glow-pink">
              DITO & FEITO
            </h1>
            <p className="text-cyan-400 font-retro text-xl md:text-2xl tracking-widest text-glow-blue mt-1">
              ★ SESSÃO DISCO & AVALIAÇÕES RETRO ★
            </p>
          </div>

          {/* Navegação de Abas */}
          <nav className="flex bg-slate-950 p-2 rounded-2xl border border-pink-500/30 gap-2">
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
                      ? "bg-pink-600 text-white font-bold box-glow-pink"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Modo Solo */}
        {activeTab === "solo" && (
          <section className="space-y-6">
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-pink-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Digite o nome do filme (ex: Pulp, Matrix)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-pink-500/50 rounded-2xl pl-12 pr-12 py-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:box-glow-pink transition-all font-retro text-2xl"
                />
                {loading && (
                  <Loader2 className="absolute right-4 w-5 h-5 text-cyan-400 animate-spin" />
                )}
              </div>
            </div>

            {/* Resultado da busca instantânea */}
            {movies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl overflow-hidden p-4 flex flex-col justify-between box-glow-blue hover:border-cyan-400 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <span className="text-slate-600 font-pixel text-[10px]">SEM CAPA</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-pixel text-sm text-pink-400 line-clamp-1">{movie.title}</h3>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                        <span>{movie.release_date?.split("-")[0] || "N/A"}</span>
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-3.5 h-3.5 fill-yellow-400" />
                          {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs line-clamp-3">
                        {movie.overview || "Sem sinopse disponível."}
                      </p>
                    </div>
                    <button className="mt-4 w-full bg-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/50 font-pixel text-[10px] py-2.5 rounded-xl transition-all">
                      AVALIAR FILME
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/80 box-glow-blue rounded-3xl p-10 text-center space-y-3 border border-cyan-500/30">
                <Sparkles className="w-10 h-10 mx-auto text-cyan-400 animate-pulse" />
                <p className="text-cyan-300 font-retro text-2xl tracking-wider">
                  {searchQuery.length > 0 && searchQuery.length < 3
                    ? "DIGITE MAIS CARACTERES..."
                    : "DIGITE O NOME DE UM FILME PARA COMEÇAR"}
                </p>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Digite pelo menos 3 letras para carregar as sugestões e capas instantaneamente.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Modo Duo */}
        {activeTab === "duo" && (
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 box-glow-pink p-6 rounded-3xl border border-pink-500/40 space-y-4">
              <h2 className="text-xl font-pixel text-pink-400">CRIAR SALA</h2>
              <p className="text-slate-400 text-xs">
                Crie uma sala privada para votar em filmes com sua namorada ou amigos.
              </p>
              <button className="w-full bg-pink-600 hover:bg-pink-500 text-white font-pixel text-xs py-3.5 rounded-xl box-glow-pink transition-all">
                GERAR CÓDIGO
              </button>
            </div>

            <div className="bg-slate-900/90 box-glow-blue p-6 rounded-3xl border border-cyan-500/40 space-y-4">
              <h2 className="text-xl font-pixel text-cyan-400">ENTRAR EM SALA</h2>
              <p className="text-slate-400 text-xs">Digite o código gerado pela outra pessoa.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="EX: DISCO-80"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono text-slate-100 uppercase focus:outline-none focus:border-cyan-500 text-xs"
                />
                <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-pixel text-xs px-5 py-2.5 rounded-xl transition-all">
                  ENTRAR
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Modo Pódio */}
        {activeTab === "podio" && (
          <section className="bg-slate-900/90 box-glow-blue rounded-3xl p-10 text-center space-y-4 border border-cyan-500/40">
            <Trophy className="w-14 h-14 text-yellow-400 mx-auto animate-bounce" />
            <h2 className="text-2xl font-pixel text-yellow-400">PÓDIO DA SESSÃO</h2>
            <p className="text-slate-400 font-retro text-xl max-w-md mx-auto">
              OS FILMES MAIS BEM AVALIADOS APARECERÃO AQUI EM 1º, 2º E 3º LUGAR!
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
