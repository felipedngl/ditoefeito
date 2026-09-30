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
  Tv,
  X,
  BookOpen,
  ArrowLeft,
  MessageSquare,
  Crown,
  QrCode,
  KeyRound,
  Pencil,
  Trash2,
  Share2,
} from "lucide-react";

const TMDB_API_KEY = "f387a8d39e74287934d786c1f2c2fe57";

type ModeType = "solo" | "duo" | "grupo" | null;
type ViewType = "busca" | "biblioteca" | "podio" | "perfil";

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  media_type?: "movie" | "tv";
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  overview: string;
}

interface Review {
  author: string;
  text: string;
}

interface EvaluatedItem {
  id: number;
  title: string;
  media_type: "movie" | "tv";
  poster_path: string | null;
  release_date: string;
  ratings: { [author: string]: number };
  averageRating: number;
  reviews: Review[];
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
];

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<ModeType>(null);
  const [activeView, setActiveView] = useState<ViewType>("busca");

  // Perfil e Identificação
  const [userName, setUserName] = useState("Dissa");
  const [partnerName, setPartnerName] = useState("Kelly");
  const [userAvatar, setUserAvatar] = useState(PRESET_AVATARS[0]);

  // Sala
  const [customRoomCode, setCustomRoomCode] = useState("");
  const [isRoomJoined, setIsRoomJoined] = useState(false);

  // TMDB Busca
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [trendingMedia, setTrendingMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal Avaliação
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [partnerRating, setPartnerRating] = useState<number>(0);
  const [partnerReviewText, setPartnerReviewText] = useState("");

  const [activeReviewModal, setActiveReviewModal] = useState<{ author: string; text: string } | null>(null);
  const [evaluatedList, setEvaluatedList] = useState<EvaluatedItem[]>([]);

  // Persistência LocalStorage
  useEffect(() => {
    const savedData = localStorage.getItem("ditoefeito_evaluations");
    if (savedData) {
      try { setEvaluatedList(JSON.parse(savedData)); } catch (e) { console.error(e); }
    }
    const savedUser = localStorage.getItem("ditoefeito_username");
    if (savedUser) setUserName(savedUser);
    const savedAvatar = localStorage.getItem("ditoefeito_avatar");
    if (savedAvatar) setUserAvatar(savedAvatar);
  }, []);

  useEffect(() => {
    localStorage.setItem("ditoefeito_evaluations", JSON.stringify(evaluatedList));
  }, [evaluatedList]);

  useEffect(() => {
    localStorage.setItem("ditoefeito_username", userName);
    localStorage.setItem("ditoefeito_avatar", userAvatar);
  }, [userName, userAvatar]);

  const handleGenerateRandomCode = () => {
    setCustomRoomCode("SESSAO-" + Math.floor(1000 + Math.random() * 9000));
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}&language=pt-BR`);
        const data = await res.json();
        if (data.results) {
          const filtered = data.results.filter((item: any) => item.media_type === "movie" || item.media_type === "tv");
          setTrendingMedia(filtered.slice(0, 16));
        }
      } catch (e) { console.error(e); }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    const fetchSearch = async () => {
      if (searchQuery.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.results) {
          const filtered = data.results.filter((item: any) => item.media_type === "movie" || item.media_type === "tv");
          setSearchResults(filtered);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    const timeoutId = setTimeout(fetchSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleStarClick = (starIndex: number, currentVal: number, setValFunc: (v: number) => void) => {
    setValFunc(currentVal === starIndex ? starIndex - 0.5 : starIndex);
  };

  const handleEditEvaluation = (item: EvaluatedItem) => {
    setSelectedMedia({
      id: item.id,
      title: item.title,
      media_type: item.media_type,
      poster_path: item.poster_path,
      release_date: item.release_date,
      vote_average: 0,
      overview: "",
    });
    setEditingMediaId(item.id);
    const currentUser = userName.trim() || "Você";
    const currentPartner = partnerName.trim() || "Parceiro(a)";
    setRating(item.ratings[currentUser] || 0);
    setReviewText(item.reviews.find((r) => r.author === currentUser)?.text || "");
    if (selectedMode === "duo" || selectedMode === "grupo") {
      setPartnerRating(item.ratings[currentPartner] || 0);
      setPartnerReviewText(item.reviews.find((r) => r.author === currentPartner)?.text || "");
    }
  };

  const handleDeleteEvaluation = (id: number) => {
    setEvaluatedList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveEvaluation = () => {
    if (!selectedMedia) return;
    const isDuoOrGroup = selectedMode === "duo" || selectedMode === "grupo";
    const authorOne = userName.trim() || "Você";
    const authorTwo = partnerName.trim() || "Parceiro(a)";

    const ratingsObj: { [k: string]: number } = { [authorOne]: rating };
    const reviewsArr: Review[] = [];
    if (reviewText.trim()) reviewsArr.push({ author: authorOne, text: reviewText });

    if (isDuoOrGroup) {
      ratingsObj[authorTwo] = partnerRating;
      if (partnerReviewText.trim()) reviewsArr.push({ author: authorTwo, text: partnerReviewText });
    }

    const avg = Object.values(ratingsObj).reduce((a, b) => a + b, 0) / Object.values(ratingsObj).length;
    const titleOrName = selectedMedia.title || selectedMedia.name || "Sem título";

    const newEval: EvaluatedItem = {
      id: selectedMedia.id,
      title: titleOrName,
      media_type: selectedMedia.media_type || "movie",
      poster_path: selectedMedia.poster_path,
      release_date: selectedMedia.release_date || selectedMedia.first_air_date || "",
      ratings: ratingsObj,
      averageRating: parseFloat(avg.toFixed(1)),
      reviews: reviewsArr,
    };

    setEvaluatedList((prev) => [newEval, ...prev.filter((m) => m.id !== selectedMedia.id)]);
    setSelectedMedia(null);
    setEditingMediaId(null);
    setReviewText("");
    setPartnerReviewText("");
    setActiveView("podio");
  };

  const currentDisplayList = searchQuery.length >= 3 ? searchResults : trendingMedia;
  const moviesList = evaluatedList.filter(item => item.media_type === "movie").sort((a, b) => b.averageRating - a.averageRating);
  const seriesList = evaluatedList.filter(item => item.media_type === "tv").sort((a, b) => b.averageRating - a.averageRating);
  const currentUser = userName.trim() || "Você";
  const userPersonalEvaluations = evaluatedList.filter(item => item.ratings[currentUser] !== undefined);

  const handleShareProfile = () => {
    const text = `Confira minhas avaliações no Dito & Feito! Total de títulos avaliados: ${userPersonalEvaluations.length}`;
    if (navigator.share) {
      navigator.share({ title: "Dito & Feito - Perfil", text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link do perfil copiado para a área de transferência!");
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", padding: "2rem 1rem", fontFamily: "sans-serif", position: "relative", overflowX: "hidden" }}>
      
      <style>{`
        .retro-grid-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .retro-grid-lines {
          position: absolute; inset: -100%;
          background-image: linear-gradient(to right, rgba(236, 72, 153, 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(236, 72, 153, 0.35) 1px, transparent 1px);
          background-size: 50px 50px;
          transform: perspective(500px) rotateX(65deg);
          animation: grid-scroll 12s linear infinite;
          transform-origin: 50% 0;
        }
        .retro-grid-overlay {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 30%, rgba(6, 9, 19, 0.5) 10%, rgba(6, 9, 19, 0.95) 90%);
        }
        @keyframes grid-scroll { 0% { transform: perspective(500px) rotateX(65deg) translateY(0); } 100% { transform: perspective(500px) rotateX(65deg) translateY(50px); } }
      `}</style>

      <div className="retro-grid-bg">
        <div className="retro-grid-lines" />
        <div className="retro-grid-overlay" />
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        
        {/* TELA INICIAL */}
        {!selectedMode ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "85vh", gap: "2.5rem", textAlign: "center" }}>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <img
                src="/logo.png"
                alt="Dito & Feito Logo"
                style={{ width: "140px", height: "140px", objectFit: "contain", filter: "drop-shadow(0 0 15px rgba(236,72,153,0.5))" }}
                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
              />
              <h1 style={{ fontSize: "2.8rem", fontWeight: "bold", color: "#ec4899", margin: 0, textShadow: "0 0 25px rgba(236,72,153,0.7)" }}>
                DITO & FEITO
              </h1>
              <p style={{ color: "#22d3ee", fontSize: "1.1rem", margin: 0, letterSpacing: "2px", fontWeight: "600" }}>
                AVALIAÇÕES DE FILMES E SÉRIES
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", width: "100%" }}>
              <button
                onClick={() => setSelectedMode("solo")}
                style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(236, 72, 153, 0.5)", borderRadius: "1.5rem", padding: "1.75rem", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", boxShadow: "0 0 20px rgba(236, 72, 153, 0.15)" }}
              >
                <User style={{ width: "2.25rem", height: "2.25rem", color: "#ec4899" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#ec4899", margin: 0 }}>Solo</h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Avaliações individuais.</p>
              </button>

              <button
                onClick={() => setSelectedMode("duo")}
                style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(34, 211, 238, 0.5)", borderRadius: "1.5rem", padding: "1.75rem", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", boxShadow: "0 0 20px rgba(34, 211, 238, 0.15)" }}
              >
                <Heart style={{ width: "2.25rem", height: "2.25rem", color: "#22d3ee" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#22d3ee", margin: 0 }}>Casalzinho</h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Avaliação conjunta, com a nota conjunta</p>
              </button>

              <button
                onClick={() => setSelectedMode("grupo")}
                style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(234, 179, 8, 0.5)", borderRadius: "1.5rem", padding: "1.75rem", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", boxShadow: "0 0 20px rgba(234, 179, 8, 0.15)" }}
              >
                <Users style={{ width: "2.25rem", height: "2.25rem", color: "#eab308" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#eab308", margin: 0 }}>Grupinho</h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Avaliação de 3 a 10 amigos juntos.</p>
              </button>
            </div>
          </div>
        ) : !isRoomJoined ? (

          /* TELA DE IDENTIFICAÇÃO (SOLO, DUO, GRUPO) */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "75vh", justifyContent: "center", gap: "1.5rem" }}>
            <button onClick={() => setSelectedMode(null)} style={{ background: "none", border: "none", color: "#ec4899", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
              <ArrowLeft style={{ width: "1.1rem", height: "1.1rem" }} /> Voltar para Seleção de Modo
            </button>

            <div style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(34, 211, 238, 0.5)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "460px", textAlign: "center", display: "flex", flexDirection: "column", gap: "1.25rem", boxShadow: "0 0 30px rgba(34, 211, 238, 0.2)" }}>
              <h2 style={{ color: "#22d3ee", margin: 0, fontSize: "1.5rem" }}>
                Identificação ({selectedMode === "duo" ? "Casalzinho" : selectedMode === "grupo" ? "Grupinho" : "Solo"})
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#ec4899", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Seu Nome de Usuário:</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    style={{ width: "100%", backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem", color: "#fff", outline: "none", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>

                {(selectedMode === "duo" || selectedMode === "grupo") && (
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "#22d3ee", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Nome do(a) Acompanhante / Parceiro(a):</label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      style={{ width: "100%", backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem", color: "#fff", outline: "none", fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                )}
              </div>

              {(selectedMode === "duo" || selectedMode === "grupo") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", borderTop: "1px solid #1e293b", paddingTop: "1rem" }}>
                  <div style={{ position: "relative" }}>
                    <KeyRound style={{ position: "absolute", left: "1rem", top: "0.85rem", width: "1.1rem", height: "1.1rem", color: "#22d3ee" }} />
                    <input
                      type="text"
                      placeholder="CÓDIGO DA SALA (EX: CASAL123)"
                      value={customRoomCode}
                      onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                      style={{ width: "100%", backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem 1rem 0.75rem 2.75rem", textAlign: "center", color: "#fff", textTransform: "uppercase", outline: "none", fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                  <button onClick={handleGenerateRandomCode} style={{ background: "none", border: "none", color: "#22d3ee", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}>
                    ⚡ Gerar código aleatório
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  if ((selectedMode === "duo" || selectedMode === "grupo") && !customRoomCode.trim()) {
                    alert("Por favor, digite ou gere um código para a sala.");
                    return;
                  }
                  if (!userName.trim()) {
                    alert("Por favor, digite seu nome de usuário.");
                    return;
                  }
                  setIsRoomJoined(true);
                }}
                style={{ backgroundColor: "#06b6d4", color: "#020617", border: "none", borderRadius: "0.75rem", padding: "0.9rem", fontWeight: "bold", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 0 15px rgba(6, 182, 212, 0.4)", marginTop: "0.5rem" }}
              >
                ENTRAR NA SESSÃO
              </button>
            </div>
          </div>

        ) : (

          /* ÁREA PRINCIPAL COM O NOME DO USUÁRIO NO TOPO */
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(236,72,153,0.4)", padding: "1rem 1.25rem", borderRadius: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button onClick={() => setSelectedMode(null)} style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.5rem", color: "#ec4899", cursor: "pointer" }}>
                  <ArrowLeft style={{ width: "1.2rem", height: "1.2rem" }} />
                </button>
                <div>
                  {/* NOME DE USUÁRIO ESCOLHIDO NO TOPO */}
                  <h1 style={{ fontSize: "1.2rem", color: "#ec4899", margin: 0, fontWeight: "bold", textTransform: "uppercase" }}>
                    {userName.trim() || "MEU PERFIL"}
                  </h1>
                  <span style={{ fontSize: "0.75rem", color: "#22d3ee", textTransform: "uppercase", fontWeight: "bold" }}>
                    {selectedMode === "duo" ? "Casalzinho" : selectedMode} {customRoomCode && `(${customRoomCode})`}
                  </span>
                </div>
              </div>

              <nav style={{ display: "flex", gap: "0.3rem", backgroundColor: "#020617", padding: "0.3rem", borderRadius: "1rem" }}>
                {[
                  { id: "busca", label: "Buscar", icon: Search },
                  { id: "biblioteca", label: "Biblioteca", icon: BookOpen },
                  { id: "podio", label: "Pódio", icon: Trophy },
                  { id: "perfil", label: "Perfil", icon: User },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveView(tab.id as ViewType)}
                      style={{ backgroundColor: isActive ? "#db2777" : "transparent", color: "#fff", border: "none", padding: "0.4rem 0.75rem", borderRadius: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: "600" }}
                    >
                      <Icon style={{ width: "0.9rem", height: "0.9rem" }} /> {tab.label}
                    </button>
                  );
                })}
              </nav>
            </header>

            {/* ABA BUSCA */}
            {activeView === "busca" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ position: "relative", width: "100%" }}>
                  <Search style={{ position: "absolute", left: "1.2rem", top: "1.1rem", width: "1.2rem", height: "1.2rem", color: "#ec4899" }} />
                  <input
                    type="text"
                    placeholder="Pesquise um filme ou série (ex: Breaking Bad, Interstellar)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "100%", backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(236,72,153,0.5)", borderRadius: "1.25rem", padding: "1rem 1rem 1rem 3rem", color: "#fff", fontSize: "1.1rem", outline: "none", boxSizing: "border-box" }}
                  />
                  {loading && <Loader2 style={{ position: "absolute", right: "1.2rem", top: "1.1rem", width: "1.2rem", height: "1.2rem", color: "#22d3ee" }} className="animate-spin" />}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "1.25rem" }}>
                  {currentDisplayList.map((media) => {
                    const isTv = media.media_type === "tv" || (!media.title && !!media.name);
                    const titleText = media.title || media.name || "Sem título";
                    const yearText = (media.release_date || media.first_air_date)?.split("-")[0] || "Ano N/A";

                    return (
                      <div
                        key={media.id}
                        onClick={() => {
                          setSelectedMedia({ ...media, media_type: isTv ? "tv" : "movie" });
                          setEditingMediaId(null);
                          setRating(0);
                          setReviewText("");
                          setPartnerRating(0);
                          setPartnerReviewText("");
                        }}
                        style={{ backgroundColor: "rgba(15, 23, 42, 0.85)", border: "1px solid #1e293b", borderRadius: "1rem", padding: "0.75rem", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.5rem" }}
                      >
                        <div style={{ aspectRatio: "2/3", width: "100%", backgroundColor: "#020617", borderRadius: "0.75rem", overflow: "hidden", position: "relative" }}>
                          {media.poster_path ? (
                            <img src={`https://image.tmdb.org/t/p/w500${media.poster_path}`} alt={titleText} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <Film style={{ width: "2rem", height: "2rem", margin: "auto", color: "#475569" }} />
                          )}
                          <span style={{ position: "absolute", top: "0.4rem", left: "0.4rem", backgroundColor: isTv ? "rgba(34,211,238,0.85)" : "rgba(236,72,153,0.85)", color: "#020617", fontSize: "0.65rem", fontWeight: "bold", padding: "0.15rem 0.35rem", borderRadius: "0.3rem", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            {isTv ? <Tv style={{ width: "0.6rem", height: "0.6rem" }} /> : <Film style={{ width: "0.6rem", height: "0.6rem" }} />}
                            {isTv ? "SÉRIE" : "FILME"}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#f8fafc", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{titleText}</h3>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{yearText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ABA BIBLIOTECA */}
            {activeView === "biblioteca" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <h2 style={{ color: "#22d3ee", margin: 0, fontSize: "1.4rem" }}>Biblioteca Geral de Avaliações</h2>
                {evaluatedList.length === 0 ? (
                  <div style={{ backgroundColor: "rgba(15, 23, 42, 0.8)", padding: "2.5rem", borderRadius: "1.5rem", textAlign: "center", color: "#94a3b8" }}>
                    <p style={{ margin: 0 }}>Nenhum título avaliado ainda.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                    {evaluatedList.map((item) => (
                      <div key={item.id} style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(34, 211, 238, 0.3)", padding: "1rem", borderRadius: "1.25rem", display: "flex", gap: "1rem", position: "relative" }}>
                        <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} style={{ width: "75px", height: "110px", borderRadius: "0.6rem", objectFit: "cover" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <h3 style={{ margin: 0, fontSize: "1rem", color: "#fff" }}>{item.title}</h3>
                              <span style={{ fontSize: "0.65rem", color: item.media_type === "tv" ? "#22d3ee" : "#ec4899", fontWeight: "bold" }}>{item.media_type === "tv" ? "SÉRIE" : "FILME"}</span>
                            </div>
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <button onClick={() => handleEditEvaluation(item)} style={{ background: "none", border: "none", color: "#22d3ee", cursor: "pointer" }}><Pencil style={{ width: "0.9rem", height: "0.9rem" }} /></button>
                              <button onClick={() => handleDeleteEvaluation(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 style={{ width: "0.9rem", height: "0.9rem" }} /></button>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {Object.entries(item.ratings).map(([author, score]) => (
                              <span key={author} style={{ backgroundColor: "#020617", padding: "0.25rem 0.5rem", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#ec4899", border: "1px solid #1e293b" }}>{author}: {score} ★</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA PÓDIO SEPARADA (FILMES E SÉRIES) */}
            {activeView === "podio" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "3rem", textAlign: "center" }}>
                
                {/* Pódio de Filmes */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                  <h2 style={{ color: "#ec4899", fontSize: "1.6rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Film style={{ width: "1.5rem", height: "1.5rem" }} /> Pódio de Filmes
                  </h2>
                  {moviesList.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Nenhum filme avaliado ainda.</p>
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", justifyContent: "center", width: "100%", maxWidth: "550px" }}>
                      {moviesList[1] && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                          <div style={{ width: "80px", height: "120px", borderRadius: "0.75rem", overflow: "hidden", border: "2px solid #22d3ee" }}>
                            <img src={`https://image.tmdb.org/t/p/w500${moviesList[1].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "#22d3ee", fontWeight: "bold", marginTop: "0.4rem" }}>{moviesList[1].averageRating} ★</span>
                          <div style={{ width: "100%", height: "80px", backgroundColor: "rgba(6,182,212,0.2)", borderTop: "3px solid #22d3ee", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#22d3ee" }}>2</div>
                        </div>
                      )}
                      {moviesList[0] && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, marginTop: "-1.5rem" }}>
                          <Crown style={{ width: "2rem", height: "2rem", color: "#eab308", marginBottom: "0.2rem" }} />
                          <div style={{ width: "100px", height: "150px", borderRadius: "0.75rem", overflow: "hidden", border: "3px solid #eab308", boxShadow: "0 0 20px rgba(234,179,8,0.4)" }}>
                            <img src={`https://image.tmdb.org/t/p/w500${moviesList[0].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <span style={{ fontSize: "0.9rem", color: "#eab308", fontWeight: "bold", marginTop: "0.4rem" }}>{moviesList[0].averageRating} ★</span>
                          <div style={{ width: "100%", height: "110px", backgroundColor: "rgba(234,179,8,0.25)", borderTop: "4px solid #eab308", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", color: "#eab308" }}>1</div>
                        </div>
                      )}
                      {moviesList[2] && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                          <div style={{ width: "80px", height: "120px", borderRadius: "0.75rem", overflow: "hidden", border: "2px solid #ec4899" }}>
                            <img src={`https://image.tmdb.org/t/p/w500${moviesList[2].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "#ec4899", fontWeight: "bold", marginTop: "0.4rem" }}>{moviesList[2].averageRating} ★</span>
                          <div style={{ width: "100%", height: "60px", backgroundColor: "rgba(236,72,153,0.2)", borderTop: "3px solid #ec4899", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#ec4899" }}>3</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pódio de Séries */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", borderTop: "1px solid #1e293b", paddingTop: "2rem" }}>
                  <h2 style={{ color: "#22d3ee", fontSize: "1.6rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Tv style={{ width: "1.5rem", height: "1.5rem" }} /> Pódio de Séries
                  </h2>
                  {seriesList.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Nenhuma série avaliada ainda.</p>
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", justifyContent: "center", width: "100%", maxWidth: "550px" }}>
                      {seriesList[1] && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                          <div style={{ width: "80px", height: "120px", borderRadius: "0.75rem", overflow: "hidden", border: "2px solid #22d3ee" }}>
                            <img src={`https://image.tmdb.org/t/p/w500${seriesList[1].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "#22d3ee", fontWeight: "bold", marginTop: "0.4rem" }}>{seriesList[1].averageRating} ★</span>
                          <div style={{ width: "100%", height: "80px", backgroundColor: "rgba(6,182,212,0.2)", borderTop: "3px solid #22d3ee", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#22d3ee" }}>2</div>
                        </div>
                      )}
                      {seriesList[0] && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, marginTop: "-1.5rem" }}>
                          <Crown style={{ width: "2rem", height: "2rem", color: "#eab308", marginBottom: "0.2rem" }} />
                          <div style={{ width: "100px", height: "150px", borderRadius: "0.75rem", overflow: "hidden", border: "3px solid #eab308", boxShadow: "0 0 20px rgba(234,179,8,0.4)" }}>
                            <img src={`https://image.tmdb.org/t/p/w500${seriesList[0].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <span style={{ fontSize: "0.9rem", color: "#eab308", fontWeight: "bold", marginTop: "0.4rem" }}>{seriesList[0].averageRating} ★</span>
                          <div style={{ width: "100%", height: "110px", backgroundColor: "rgba(234,179,8,0.25)", borderTop: "4px solid #eab308", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", color: "#eab308" }}>1</div>
                        </div>
                      )}
                      {seriesList[2] && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                          <div style={{ width: "80px", height: "120px", borderRadius: "0.75rem", overflow: "hidden", border: "2px solid #ec4899" }}>
                            <img src={`https://image.tmdb.org/t/p/w500${seriesList[2].poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "#ec4899", fontWeight: "bold", marginTop: "0.4rem" }}>{seriesList[2].averageRating} ★</span>
                          <div style={{ width: "100%", height: "60px", backgroundColor: "rgba(236,72,153,0.2)", borderTop: "3px solid #ec4899", borderRadius: "0.5rem 0.5rem 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#ec4899" }}>3</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ABA PERFIL */}
            {activeView === "perfil" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                <div style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(236,72,153,0.4)", borderRadius: "1.5rem", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", textAlign: "center" }}>
                  <img src={userAvatar} alt="Avatar" style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "3px solid #ec4899", boxShadow: "0 0 15px rgba(236,72,153,0.4)" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", maxWidth: "300px" }}>
                    <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "bold" }}>Seu Nome de Perfil:</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.6rem", color: "#fff", textAlign: "center", fontWeight: "bold", outline: "none" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
                    <span style={{ fontSize: "0.8rem", color: "#22d3ee", fontWeight: "bold" }}>Escolha seu Avatar (Estilo Streaming):</span>
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      {PRESET_AVATARS.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="Preset"
                          onClick={() => setUserAvatar(url)}
                          style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", cursor: "pointer", border: userAvatar === url ? "3px solid #22d3ee" : "2px solid transparent" }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleShareProfile}
                    style={{ backgroundColor: "#06b6d4", color: "#020617", border: "none", borderRadius: "0.75rem", padding: "0.75rem 1.5rem", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginTop: "0.5rem" }}
                  >
                    <Share2 style={{ width: "1rem", height: "1rem" }} /> Compartilhar Meu Perfil
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <h3 style={{ color: "#22d3ee", margin: 0, fontSize: "1.2rem" }}>Minhas Avaliações Pessoais ({userName})</h3>
                  {userPersonalEvaluations.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Você ainda não avaliou nenhum título individualmente.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {userPersonalEvaluations.map((item) => {
                        const myRating = item.ratings[currentUser];
                        const myReview = item.reviews.find((r) => r.author === currentUser)?.text;
                        return (
                          <div key={item.id} style={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid #1e293b", padding: "1rem", borderRadius: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                            <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt="" style={{ width: "55px", height: "80px", borderRadius: "0.5rem", objectFit: "cover" }} />
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
                              <h4 style={{ margin: 0, fontSize: "1rem", color: "#fff" }}>{item.title}</h4>
                              <span style={{ fontSize: "0.8rem", color: "#ec4899", fontWeight: "bold" }}>Sua Nota: {myRating} ★</span>
                              {myReview && <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>"{myReview}"</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* MODAL DE AVALIAÇÃO */}
        {selectedMedia && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 100 }}>
            <div style={{ backgroundColor: "#0f172a", border: "1px solid rgba(236,72,153,0.5)", borderRadius: "1.5rem", padding: "1.5rem", maxWidth: "520px", width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative" }}>
              
              <button onClick={() => setSelectedMedia(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>

              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <img src={`https://image.tmdb.org/t/p/w500${selectedMedia.poster_path}`} alt="" style={{ width: "90px", height: "135px", borderRadius: "0.6rem", objectFit: "cover" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#fff" }}>{selectedMedia.title || selectedMedia.name}</h3>
                  <span style={{ fontSize: "0.75rem", color: "#eab308", fontWeight: "bold" }}>TMDB: {selectedMedia.vote_average?.toFixed(1) || "N/A"} / 10 ★</span>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{selectedMedia.overview || "Sem sinopse."}</p>
                </div>
              </div>

              {/* Nota Usuário 1 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#ec4899", fontWeight: "bold" }}>Nota de {userName.trim() || "Você"}: {rating} / 10 ★</span>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button key={star} onClick={() => handleStarClick(star, rating, setRating)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <Star style={{ width: "1.2rem", height: "1.2rem", color: rating >= star ? "#ec4899" : "#334155", fill: rating >= star ? "#ec4899" : "none" }} />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Sua crítica/resenha (opcional)..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem", color: "#fff", fontSize: "0.85rem", outline: "none", resize: "none" }}
                />
              </div>

              {/* Nota Acompanhante */}
              {(selectedMode === "duo" || selectedMode === "grupo") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid #1e293b", paddingTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#22d3ee", fontWeight: "bold" }}>Nota de {partnerName.trim() || "Parceiro(a)"}: {partnerRating} / 10 ★</span>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button key={star} onClick={() => handleStarClick(star, partnerRating, setPartnerRating)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <Star style={{ width: "1.2rem", height: "1.2rem", color: partnerRating >= star ? "#22d3ee" : "#334155", fill: partnerRating >= star ? "#22d3ee" : "none" }} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Crítica/resenha do parceiro..."
                    value={partnerReviewText}
                    onChange={(e) => setPartnerReviewText(e.target.value)}
                    style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem", color: "#fff", fontSize: "0.85rem", outline: "none", resize: "none" }}
                  />
                </div>
              )}

              <button onClick={handleSaveEvaluation} style={{ backgroundColor: "#db2777", color: "#fff", border: "none", borderRadius: "0.75rem", padding: "0.85rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem" }}>
                {editingMediaId ? "ATUALIZAR AVALIAÇÃO" : "ENVIAR AVALIAÇÃO"}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
