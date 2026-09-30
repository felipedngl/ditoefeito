"use client";

import React, { useState, useEffect } from "react";
import { Search, User, Users, Trophy, Star, Loader2, Film, X, Check, Heart } from "lucide-react";

// === COLE SUA CHAVE DO TMDB AQUI ===
const TMDB_API_KEY = "f387a8d39e74287934d786c1f2c2fe57"; 

const BACKGROUND_POSTERS = [
  "https://image.tmdb.org/t/p/w500/811P3306S2A9q33K35R31kX30.jpg",
  "https://image.tmdb.org/t/p/w500/dXp1o6A3r9Gf3p7p4W.jpg",
  "https://image.tmdb.org/t/p/w500/7WsyChLLEz33B3TeP3.jpg",
  "https://image.tmdb.org/t/p/w500/pB8BM72569u398492.jpg",
  "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEmt33P3.jpg",
];

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
  
  // Estado para controlar o Modal de Votação
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [userRating, setUserRating] = useState<number>(8);
  const [userComment, setUserComment] = useState("");
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  // Busca automática via TMDB
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
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleOpenVoteModal = (movie: Movie) => {
    setSelectedMovie(movie);
    setUserRating(8);
    setUserComment("");
    setVoteSubmitted(false);
  };

  const handleSaveVote = () => {
    setVoteSubmitted(true);
    setTimeout(() => {
      setSelectedMovie(null);
    }, 1500);
  };

  return (
    <main className="relative min-h-screen bg-[#080d1a] text-slate-100 font-sans px-4 py-6 md:py-10 overflow-x-hidden">
      {/* Background 3D Orbit do 21st.dev (Carrossel no fundo) */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-15 flex items-center justify-center overflow-hidden">
        <div className="relative w-[750px] h-[750px] animate-[spin_50s_linear_infinite] rounded-full border border-pink-500/20">
          {BACKGROUND_POSTERS.map((src, index) => {
            const angle = (index / BACKGROUND_POSTERS.length) * 360;
            return (
              <div
                key={index}
                className="absolute w-24 h-36 rounded-xl overflow-hidden shadow-2xl border border-cyan-400/30"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${angle}deg) translate(300px) rotate(-${angle}deg)`,
                }}
              >
                <img src={src} alt="Poster Fundo" className="w-full h-full object-cover" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Cabeçalho Elegante com Logo */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/60 backdrop-blur-xl border border-pink-500/30 p-5 md:p-6 rounded-3xl shadow-[0_0_25px_rgba(255,0,127,0.15)]">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Dito & Feito"
              className="w-12 h-12 md:w-14 md:h-14 object-contain filter drop-shadow-[0_0_10px_rgba(255,0,127,0.5)]"
              onError={(e) => {
                // Esconde a tag se a imagem /logo.png não estiver salva na pasta public
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400">
                DITO & FEITO
              </h1>
              <p className="text-xs md:text-sm text-cyan-400 font-medium tracking-wider">
                SESSÃO DISCO & AVALIAÇÕES DE CINEMA
              </p>
            </div>
          </div>

          {/* Navegação entre Modos */}
          <nav className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 gap-1">
            {[
              { id: "solo", label: "SOLO", icon: User },
              { id: "duo", label: "DUO / GRUPO", icon: Users },
              { id: "podio", label: "PÓDIO", icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* --- ABA SOLO: BUSCA & LISTAGEM --- */}
        {activeTab === "solo" && (
          <section className="space-y-6">
            <div className="relative max-w-2xl mx-auto">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-pink-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar filme no TMDB (ex: Matrix, Pulp Fiction)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 backdrop-blur-md border border-pink-500/30 rounded-2xl pl-12 pr-12 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all text-sm md:text-base"
                />
                {loading && (
                  <Loader2 className="absolute right-4 w-5 h-5 text-cyan-400 animate-spin" />
                )}
              </div>
            </div>

            {/* Listagem em Cards Reduzidos / Polidos */}
            {movies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="group bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(255,0,127,0.2)] transition-all duration-300"
                  >
                    <div>
                      {/* Capa com tamanho proporcional */}
                      <div className="aspect-[2/3] w-full bg-slate-950 overflow-hidden relative">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-600">
                            <Film className="w-8 h-8 mb-1" />
                            <span className="text-[10px]">Sem Poster</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md border border-yellow-500/30 px-2 py-0.5 rounded-lg text-xs text-yellow-400 font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                        </div>
                      </div>

                      {/* Informações do Filme */}
                      <div className="p-3 md:p-4 space-y-1.5">
                        <h3 className="font-semibold text-sm text-slate-100 line-clamp-1 group-hover:text-pink-400 transition-colors">
                          {movie.title}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {movie.release_date ? movie.release_date.split("-")[0] : "Ano N/A"}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {movie.overview || "Sem sinopse cadastrada."}
                        </p>
                      </div>
                    </div>

                    {/* Botão de Votação */}
                    <div className="p-3 md:p-4 pt-0">
                      <button
                        onClick={() => handleOpenVoteModal(movie)}
                        className="w-full bg-gradient-to-r from-pink-600/80 to-purple-600/80 hover:from-pink-500 hover:to-purple-500 text-white font-medium text-xs py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5" /> Avaliar Filme
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-8 md:p-12 text-center max-w-lg mx-auto space-y-3">
                <Film className="w-10 h-10 mx-auto text-cyan-400 opacity-80" />
                <h2 className="text-lg font-semibold text-slate-200">
                  {searchQuery.length > 0 && searchQuery.length < 3
                    ? "Continue digitando..."
                    : "Pesquise um filme para avaliar"}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Digite o nome de qualquer obra cinematográfica no campo de busca para dar sua nota e registrar sua opinião.
                </p>
              </div>
            )}
          </section>
        )}

        {/* --- ABA DUO / GRUPO --- */}
        {activeTab === "duo" && (
          <section className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-pink-500/30 space-y-4 shadow-lg">
              <h2 className="text-lg font-semibold text-pink-400">Criar Sala Privada</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gere um código exclusivo para compartilhar e votarem juntas em tempo real.
              </p>
              <button className="w-full bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs py-3 rounded-xl transition-all shadow-md shadow-pink-600/20">
                Gerar Código de Sala
              </button>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-cyan-500/30 space-y-4 shadow-lg">
              <h2 className="text-lg font-semibold text-cyan-400">Entrar em uma Sala</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Insira o código enviado pela sua parceira para ingressar na votação.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CÓDIGO (EX: DISCO80)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center font-mono text-slate-100 uppercase focus:outline-none focus:border-cyan-500 text-xs"
                />
                <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all">
                  Entrar
                </button>
              </div>
            </div>
          </section>
        )}

        {/* --- ABA PÓDIO --- */}
        {activeTab === "podio" && (
          <section className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-10 text-center max-w-lg mx-auto space-y-4 shadow-lg">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto" />
            <h2 className="text-xl font-bold text-yellow-400">Pódio das Avaliações</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Os títulos mais bem avaliados das suas sessões solo ou em dupla ficarão em destaque aqui.
            </p>
          </section>
        )}
      </div>

      {/* --- MODAL FLUTUANTE DE VOTAÇÃO (GLASSMORPHISM) --- */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-pink-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(255,0,127,0.25)] space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Botão Fechar */}
            <button
              onClick={() => setSelectedMovie(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/50"
            >
              <X className="w-5 h-5" />
            </button>

            {voteSubmitted ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center mx-auto border border-pink-500/40">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">Voto Registrado!</h3>
                <p className="text-xs text-slate-400">Sua nota para {selectedMovie.title} foi salva com sucesso.</p>
              </div>
            ) : (
              <>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-24 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 border border-slate-800">
                    {selectedMovie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
                        alt={selectedMovie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="w-6 h-6 text-slate-700 m-auto mt-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base line-clamp-1">{selectedMovie.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedMovie.release_date ? selectedMovie.release_date.split("-")[0] : "Ano N/A"}
                    </p>
                  </div>
                </div>

                {/* Seleção de Nota */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex justify-between">
                    <span>Sua Nota:</span>
                    <span className="text-pink-400 font-bold text-sm">{userRating} / 10</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={userRating}
                    onChange={(e) => setUserRating(parseFloat(e.target.value))}
                    className="w-full accent-pink-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>1 (Péssimo)</span>
                    <span>5 (Mediano)</span>
                    <span>10 (Obra-Prima)</span>
                  </div>
                </div>

                {/* Campo de Comentário */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Sua Opinião (Opcional):</label>
                  <textarea
                    rows={3}
                    placeholder="O que achou do filme?"
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-all resize-none"
                  />
                </div>

                {/* Botão Confirmar */}
                <button
                  onClick={handleSaveVote}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-pink-600/20"
                >
                  Salvar Avaliação
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
