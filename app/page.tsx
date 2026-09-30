"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  User,
  Heart,
  Users,
  Trophy,
  Star,
  Loader2,
  Film,
  X,
  BookOpen,
  ArrowLeft,
  MessageSquare,
  Crown,
} from "lucide-react";

const TMDB_API_KEY = "f387a8d39e74287934d786c1f2c2fe57";

type ModeType = "solo" | "duo" | "grupo" | null;
type ViewType = "busca" | "biblioteca" | "podio";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

interface Review {
  author: string;
  text: string;
}

interface EvaluatedMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  ratings: { [author: string]: number };
  averageRating: number;
  reviews: Review[];
}

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<ModeType>(null);
  const [activeView, setActiveView] = useState<ViewType>("busca");

  // Busca e Listas
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal do Filme Selecionado
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [rating, setRating] = useState<number>(8);
  const [reviewText, setReviewText] = useState("");
  const [userName, setUserName] = useState("Felipe");
  const [partnerName, setPartnerName] = useState("Kelly");
  const [partnerRating, setPartnerRating] = useState<number>(7.5);
  const [partnerReviewText, setPartnerReviewText] = useState("");

  // Modal de Leitura de Crítica
  const [activeReviewModal, setActiveReviewModal] = useState<{ author: string; text: string } | null>(null);

  // Lista de Filmes Avaliados
  const [evaluatedList, setEvaluatedList] = useState<EvaluatedMovie[]>([
    {
      id: 550,
      title: "Clube da Luta",
      poster_path: "/pB8BM72569u398492.jpg",
      release_date: "1999-10-15",
      ratings: { Felipe: 9.5, Kelly: 9.0 },
      averageRating: 9.25,
      reviews: [
        { author: "Felipe", text: "Excelente ritmo, atuação impecável e direção magistral do Fincher." },
        { author: "Kelly", text: "Muito bom! O plot twist do final é surreal." },
      ],
    },
    {
      id: 680,
      title: "Pulp Fiction: Tempo de Violência",
      poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      release_date: "1994-09-10",
      ratings: { Felipe: 10.0, Kelly: 8.5 },
      averageRating: 9.25,
      reviews: [
        { author: "Felipe", text: "Clássico supremo do Tarantino. Trilha sonora e diálogos perfeitos." },
      ],
    },
  ]);

  // Carregar filmes em alta do TMDB na abertura
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR`
        );
        const data = await res.json();
        if (data.results) {
          setTrendingMovies(data.results.slice(0, 16));
        }
      } catch (e) {
        console.error("Erro ao carregar populares:", e);
      }
    };
    fetchTrending();
  }, []);

  // Busca em tempo real após 3 letras
  useEffect(() => {
    const fetchSearch = async () => {
      if (searchQuery.trim().length < 3) {
        setSearchResults([]);
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
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error("Erro na busca:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Clique na estrela (suporte a meia estrela)
  const handleStarClick = (starIndex: number, currentVal: number, setValFunc: (v: number) => void) => {
    if (currentVal === starIndex) {
      setValFunc(starIndex - 0.5);
    } else {
      setValFunc(starIndex);
    }
  };

  // Salvar Avaliação
  const handleSaveEvaluation = () => {
    if (!selectedMovie) return;

    const isDuoOrGroup = selectedMode === "duo" || selectedMode === "grupo";
    const ratingsObj: { [k: string]: number } = { [userName]: rating };
    const reviewsArr: Review[] = [];

    if (reviewText.trim()) {
      reviewsArr.push({ author: userName, text: reviewText });
    }

    if (isDuoOrGroup) {
      ratingsObj[partnerName] = partnerRating;
      if (partnerReviewText.trim()) {
        reviewsArr.push({ author: partnerName, text: partnerReviewText });
      }
    }

    const ratingValues = Object.values(ratingsObj);
    const avg = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;

    const newEval: EvaluatedMovie = {
      id: selectedMovie.id,
      title: selectedMovie.title,
      poster_path: selectedMovie.poster_path,
      release_date: selectedMovie.release_date,
      ratings: ratingsObj,
      averageRating: parseFloat(avg.toFixed(1)),
      reviews: reviewsArr,
    };

    setEvaluatedList((prev) => [newEval, ...prev.filter((m) => m.id !== selectedMovie.id)]);
    setSelectedMovie(null);
    setReviewText("");
    setPartnerReviewText("");
    setActiveView("podio");
  };

  const currentDisplayList = searchQuery.length >= 3 ? searchResults : trendingMovies;

  // Ordenação para o Pódio
  const sortedPodiumList = [...evaluatedList].sort((a, b) => b.averageRating - a.averageRating);
  const firstPlace = sortedPodiumList[0];
  const secondPlace = sortedPodiumList[1];
  const thirdPlace = sortedPodiumList[2];
  const restOfPodium = sortedPodiumList.slice(3);

  return (
    <main className="min-h-screen text-slate-100 px-4 py-8 max-w-5xl mx-auto space-y-10 font-sans">
      {/* --- TELA INICIAL: LOGO NO MEIO SUPERIOR + BOTÕES HORIZONTAIS --- */}
      {!selectedMode ? (
        <div className="flex flex-col items-center justify-center min-h-[85vh] space-y-10">
          {/* Logo Centralizada no Meio Superior */}
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              src="/logo.png"
              alt="Dito & Feito Logo"
              style={{ 
                maxWidth: "180px", 
                maxHeight: "120px", 
                width: "auto", 
                height: "auto", 
                objectFit: "contain",
                margin: "0 auto 1rem auto",
                display: "block"
              }}
            />
            <h1 className="text-3xl md:text-5xl font-bold tracking-wider text-pink-500 text-glow-pink">
              DITO & FEITO
            </h1>
            <p className="text-cyan-400 font-retro text-xl md:text-2xl text-glow-blue tracking-widest">
              SESSÃO DISCO & AVALIAÇÕES DE CINEMA
            </p>
          </div>

          {/* Botões Horizontais com Layout Bonito */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {/* Solo */}
            <button
              onClick={() => setSelectedMode("solo")}
              className="group bg-slate-900/90 border border-pink-500/40 p-6 rounded-3xl box-glow-pink card-hover flex flex-col items-center text-center cursor-pointer space-y-3"
            >
              <div className="p-3.5 bg-pink-500/10 rounded-2xl border border-pink-500/30 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-pink-400">Solo</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Avaliações individuais.
              </p>
            </button>

            {/* Casalzinho */}
            <button
              onClick={() => setSelectedMode("duo")}
              className="group bg-slate-900/90 border border-cyan-500/40 p-6 rounded-3xl box-glow-blue card-hover flex flex-col items-center text-center cursor-pointer space-y-3"
            >
              <div className="p-3.5 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-cyan-400 fill-cyan-400/20" />
              </div>
              <h3 className="text-xl font-bold text-cyan-400">Casalzinho</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Avaliação conjunta, com a nota conjunta
              </p>
            </button>

            {/* Grupinho */}
            <button
              onClick={() => setSelectedMode("grupo")}
              className="group bg-slate-900/90 border border-yellow-500/40 p-6 rounded-3xl box-glow-gold card-hover flex flex-col items-center text-center cursor-pointer space-y-3"
            >
              <div className="p-3.5 bg-yellow-500/10 rounded-2xl border border-yellow-500/30 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-yellow-400">Grupinho</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Avaliação de 3 a 10 amigos juntos.
              </p>
            </button>
          </div>
        </div>
      ) : (
        /* --- INTERFACE PRINCIPAL APÓS ENTRAR EM UM MODO --- */
        <div className="space-y-8">
          {/* Cabeçalho */}
          <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/90 border border-pink-500/30 p-5 rounded-3xl box-glow-pink">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedMode(null)}
                className="p-2.5 bg-slate-950 hover:bg-pink-600/20 border border-pink-500/30 rounded-2xl text-pink-400 transition-all"
                title="Voltar ao início"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-pink-500 text-glow-pink">DITO & FEITO</h1>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold uppercase">
                    {selectedMode === "duo" ? "Casalzinho" : selectedMode}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">Sessão Ativa</p>
              </div>
            </div>

            {/* Abas */}
            <nav className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1">
              {[
                { id: "busca", label: "Buscar Filmes", icon: Search },
                { id: "biblioteca", label: "Biblioteca", icon: BookOpen },
                { id: "podio", label: "Pódio", icon: Trophy },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id as ViewType)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-pink-600 text-white box-glow-pink"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {tab.label}
                  </button>
                );
              })}
            </nav>
          </header>

          {/* --- ABA BUSCA: Mídia com Capas Verticais Clicáveis --- */}
          {activeView === "busca" && (
            <section className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-4 w-5 h-5 text-pink-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Digite o nome do filme (ex: Matrix, Pulp Fiction)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-pink-500/40 rounded-2xl pl-12 pr-12 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:box-glow-pink transition-all font-retro text-2xl"
                />
                {loading && <Loader2 className="absolute right-4 top-4 w-5 h-5 text-cyan-400 animate-spin" />}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                <span>
                  {searchQuery.length >= 3
                    ? `SUGESTÕES PARA "${searchQuery.toUpperCase()}"`
                    : "FILMES EM ALTA NO MOMENTO"}
                </span>
                <span>TOQUE EM UMA CAPA PARA VER E VOTAR</span>
              </div>

              {/* Grade de Capas Verticais Clicáveis */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {currentDisplayList.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-pink-500/50 p-3 rounded-2xl flex flex-col justify-between cursor-pointer transition-all card-hover"
                  >
                    <div className="space-y-2">
                      <div className="aspect-[2/3] w-full bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-600">
                            <Film className="w-8 h-8 mb-1" />
                            <span className="text-[10px]">Sem Capa</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md border border-yellow-500/30 px-2 py-0.5 rounded-lg text-xs text-yellow-400 font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-100 text-sm line-clamp-1 group-hover:text-pink-400 transition-colors">
                        {movie.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {movie.release_date?.split("-")[0] || "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* --- ABA BIBLIOTECA --- */}
          {activeView === "biblioteca" && (
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-cyan-400 text-glow-blue">Sua Biblioteca de Filmes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluatedList.map((item) => (
                  <div key={item.id} className="bg-slate-900/90 border border-cyan-500/30 p-4 rounded-2xl flex gap-4 box-glow-blue">
                    <div className="w-20 h-28 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 border border-slate-800">
                      <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-bold text-slate-100 text-base">{item.title}</h3>
                      <div className="flex flex-wrap gap-2 text-xs font-mono">
                        {Object.entries(item.ratings).map(([author, score]) => (
                          <span key={author} className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-pink-400 flex items-center gap-1">
                            {author}: <Star className="w-3 h-3 fill-pink-400" /> {score}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.reviews.map((rev) => (
                          <button
                            key={rev.author}
                            onClick={() => setActiveReviewModal(rev)}
                            className="text-[11px] bg-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" /> Crítica de {rev.author}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* --- ABA PÓDIO --- */}
          {activeView === "podio" && (
            <section className="space-y-10">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-pixel text-yellow-400 text-glow-gold">PÓDIO DA SESSÃO</h2>
                <p className="text-slate-400 text-xs">Os mais bem avaliados por nota média</p>
              </div>

              <div className="flex justify-center items-end gap-3 md:gap-6 pt-10 pb-4">
                {secondPlace && (
                  <div className="flex flex-col items-center gap-2 w-28 md:w-36">
                    <div className="w-20 h-28 md:w-24 md:h-36 rounded-2xl overflow-hidden border-2 border-cyan-400 box-glow-blue shadow-xl">
                      <img src={`https://image.tmdb.org/t/p/w500${secondPlace.poster_path}`} alt={secondPlace.title} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-cyan-300 line-clamp-1">{secondPlace.title}</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{secondPlace.averageRating} ★</span>
                    <div className="w-full h-28 bg-gradient-to-t from-cyan-900/60 to-cyan-600/30 border-t-4 border-cyan-400 rounded-t-2xl flex items-center justify-center font-pixel text-2xl text-cyan-300">
                      2
                    </div>
                  </div>
                )}

                {firstPlace && (
                  <div className="flex flex-col items-center gap-2 w-32 md:w-44 -mt-8">
                    <Crown className="w-10 h-10 text-yellow-400 text-glow-gold animate-bounce" />
                    <div className="w-24 h-36 md:w-32 md:h-44 rounded-2xl overflow-hidden border-4 border-yellow-400 box-glow-gold shadow-2xl">
                      <img src={`https://image.tmdb.org/t/p/w500${firstPlace.poster_path}`} alt={firstPlace.title} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-bold text-yellow-300 line-clamp-1">{firstPlace.title}</span>
                    <span className="text-sm font-mono text-yellow-400 font-bold">{firstPlace.averageRating} ★</span>
                    <div className="w-full h-36 bg-gradient-to-t from-yellow-900/60 to-yellow-500/40 border-t-4 border-yellow-400 rounded-t-2xl flex items-center justify-center font-pixel text-4xl text-yellow-300">
                      1
                    </div>
                  </div>
                )}

                {thirdPlace && (
                  <div className="flex flex-col items-center gap-2 w-28 md:w-36">
                    <div className="w-20 h-28 md:w-24 md:h-36 rounded-2xl overflow-hidden border-2 border-pink-500 box-glow-pink shadow-xl">
                      <img src={`https://image.tmdb.org/t/p/w500${thirdPlace.poster_path}`} alt={thirdPlace.title} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-pink-300 line-clamp-1">{thirdPlace.title}</span>
                    <span className="text-xs font-mono text-pink-400 font-bold">{thirdPlace.averageRating} ★</span>
                    <div className="w-full h-20 bg-gradient-to-t from-pink-900/60 to-pink-600/30 border-t-4 border-pink-500 rounded-t-2xl flex items-center justify-center font-pixel text-2xl text-pink-300">
                      3
                    </div>
                  </div>
                )}
              </div>

              {restOfPodium.length > 0 && (
                <div className="space-y-2 pt-4">
                  <h3 className="text-xs font-mono text-slate-400 uppercase">Demais Colocações:</h3>
                  {restOfPodium.map((item, idx) => (
                    <div key={item.id} className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center justify-between font-mono text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-pink-400 font-bold">#{idx + 4}</span>
                        <span className="text-slate-200 font-sans font-semibold">{item.title}</span>
                      </div>
                      <span className="text-yellow-400 font-bold">{item.averageRating} ★</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* --- MODAL DO FILME ESCOLHIDO (INFORMAÇÕES + SINOPSE + AVALIAÇÃO COM ESTRELAS) --- */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-slate-900 border border-pink-500/40 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedMovie(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Modal: Pôster + Título + Sinopse + Nota TMDB */}
            <div className="flex flex-col sm:flex-row gap-4 items-start border-b border-slate-800 pb-4">
              <div className="w-28 h-40 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 border border-slate-800 mx-auto sm:mx-0">
                {selectedMovie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
                    alt={selectedMovie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Film className="w-8 h-8 text-slate-700 m-auto mt-14" />
                )}
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="font-bold text-slate-100 text-xl">{selectedMovie.title}</h3>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-mono text-slate-400">
                  <span>{selectedMovie.release_date?.split("-")[0] || "Ano N/A"}</span>
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                    TMDB: {selectedMovie.vote_average ? selectedMovie.vote_average.toFixed(1) : "N/A"} / 10
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed line-clamp-4">
                  {selectedMovie.overview || "Sem sinopse cadastrada."}
                </p>
              </div>
            </div>

            {/* Votação do Usuário Principal */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-pink-400">
                <span>Nota de {userName}:</span>
                <span className="text-base font-mono">{rating} / 10 ★</span>
              </div>
              <div className="flex gap-1 justify-between">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star, rating, setRating)}
                    className="p-1 focus:outline-none transition-transform hover:scale-125"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        rating >= star
                          ? "fill-pink-500 text-pink-500"
                          : rating >= star - 0.5
                          ? "fill-pink-500/50 text-pink-500"
                          : "text-slate-700"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                placeholder={`Resenha/crítica de ${userName} (Opcional)...`}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Segunda Votação (Casalzinho / Grupinho) */}
            {(selectedMode === "duo" || selectedMode === "grupo") && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center text-xs font-bold text-cyan-400">
                  <span>Nota de {partnerName}:</span>
                  <span className="text-base font-mono">{partnerRating} / 10 ★</span>
                </div>
                <div className="flex gap-1 justify-between">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarClick(star, partnerRating, setPartnerRating)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          partnerRating >= star
                            ? "fill-cyan-400 text-cyan-400"
                            : partnerRating >= star - 0.5
                            ? "fill-cyan-400/50 text-cyan-400"
                            : "text-slate-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder={`Resenha/crítica de ${partnerName} (Opcional)...`}
                  value={partnerReviewText}
                  onChange={(e) => setPartnerReviewText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <button
              onClick={handleSaveEvaluation}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg"
            >
              ENVIAR AVALIAÇÃO
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL PARA LER CRÍTICA --- */}
      {activeReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <button onClick={() => setActiveReviewModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Crítica por {activeReviewModal.author}
            </h3>
            <p className="text-slate-200 text-xs leading-relaxed italic bg-slate-950 p-4 rounded-xl border border-slate-800">
              "{activeReviewModal.text}"
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
