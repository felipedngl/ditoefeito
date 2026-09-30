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
  Crown,
  Pencil,
  Trash2,
  Share2,
  LogOut,
} from "lucide-react";

const TMDB_API_KEY = "f387a8d39e74287934d786c1f2c2fe57";

type AuthState = "login" | "modes" | "room" | "app";
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

const PET_AVATARS = [
  "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&auto=format&fit=crop&q=80",
];

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>("login");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState(PET_AVATARS[0]);
  const [selectedMode, setSelectedMode] = useState<ModeType>(null);
  const [activeView, setActiveView] = useState<ViewType>("busca");

  const [partnerName, setPartnerName] = useState("");
  const [customRoomCode, setCustomRoomCode] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [trendingMedia, setTrendingMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [partnerRating, setPartnerRating] = useState<number>(0);
  const [partnerReviewText, setPartnerReviewText] = useState("");

  const [evaluatedList, setEvaluatedList] = useState<EvaluatedItem[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const profileParam = params.get("perfil");

    if (profileParam) {
      setUserName(profileParam);
      setUserEmail(`${profileParam.toLowerCase()}@user.com`);
      setAuthState("app");
      const cloudData = localStorage.getItem(`db_evaluations_${profileParam.toUpperCase()}`);
      if (cloudData) {
        try { setEvaluatedList(JSON.parse(cloudData)); } catch (e) { console.error(e); }
      }
      return;
    }

    const savedEmail = localStorage.getItem("google_auth_email");
    const savedName = localStorage.getItem("google_auth_name");
    const savedAvatar = localStorage.getItem("google_auth_avatar");

    if (savedEmail && savedName) {
      setUserEmail(savedEmail);
      setUserName(savedName);
      if (savedAvatar) setUserAvatar(savedAvatar);
      setAuthState("modes");

      const userDbKey = `db_evaluations_${savedEmail}`;
      const savedData = localStorage.getItem(userDbKey);
      if (savedData) {
        try { setEvaluatedList(JSON.parse(savedData)); } catch (e) { console.error(e); }
      }
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      const userDbKey = `db_evaluations_${userEmail}`;
      localStorage.setItem(userDbKey, JSON.stringify(evaluatedList));
    }
    localStorage.setItem("google_auth_avatar", userAvatar);
  }, [evaluatedList, userAvatar, userEmail]);

  const handleGoogleLogin = () => {
    const mockEmail = prompt("Simulando Login com Google. Digite seu e-mail:", "dissa@gmail.com");
    if (!mockEmail) return;

    const namePart = mockEmail.split("@")[0].toUpperCase();
    setUserEmail(mockEmail);
    setUserName(namePart);

    localStorage.setItem("google_auth_email", mockEmail);
    localStorage.setItem("google_auth_name", namePart);

    const userDbKey = `db_evaluations_${mockEmail}`;
    const savedData = localStorage.getItem(userDbKey);
    if (savedData) {
      try { setEvaluatedList(JSON.parse(savedData)); } catch (e) { console.error(e); }
    }

    setAuthState("modes");
  };

  const handleLogout = () => {
    localStorage.removeItem("google_auth_email");
    localStorage.removeItem("google_auth_name");
    localStorage.removeItem("google_auth_avatar");
    setUserEmail("");
    setUserName("");
    setAuthState("login");
    setSelectedMode(null);
    window.history.replaceState({}, "", window.location.pathname);
  };

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
    const currentUser = userName.trim() || "Usuário";
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
    const authorOne = userName.trim() || "Usuário";
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
  const currentUser = userName.trim() || "Usuário";
  const userPersonalEvaluations = evaluatedList.filter(item => item.ratings[currentUser] !== undefined);

  const handleShareProfileLink = () => {
    const profileUrl = `${window.location.origin}?perfil=${encodeURIComponent(userName)}`;
    if (navigator.share) {
      navigator.share({ title: `Perfil de ${userName}`, text: `Veja as avaliações de filmes e séries de ${userName}!`, url: profileUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(profileUrl);
      alert(`Link do perfil copiado!\n\n${profileUrl}`);
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", padding: "2rem 1rem", fontFamily: "sans-serif", position: "relative", overflowX: "hidden" }}>
      
      {/* Fundo Cósmico / Universo (Milky Way Style) */}
      <style>{`
        .universe-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: radial-gradient(circle at 50% 50%, #0b0f19 0%, #030712 100%);
          overflow: hidden;
        }
        .stars-layer {
          position: absolute;
          inset: -50%;
          background-image: 
            radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 40px 70px, #22d3ee, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 90px 40px, #ec4899, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 160px 120px, #ffffff, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 200px 200px;
          animation: universe-drift 60s linear infinite;
          opacity: 0.6;
        }
        .nebula-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(34, 211, 238, 0.05) 50%, transparent 80%);
          top: 20%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(80px);
          animation: nebula-pulse 10s ease-in-out infinite alternate;
        }
        @keyframes universe-drift {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-200px) rotate(360deg); }
        }
        @keyframes nebula-pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
        }
      `}</style>

      <div className="universe-bg">
        <div className="nebula-glow" />
        <div className="stars-layer" />
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        
        {/* TELA DE LOGIN */}
        {authState === "login" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "85vh", gap: "2rem" }}>
            <div style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(236, 72, 153, 0.5)", borderRadius: "1.5rem", padding: "3rem 2rem", width: "100%", maxWidth: "420px", textAlign: "center", display: "flex", flexDirection: "column", gap: "1.75rem", boxShadow: "0 0 40px rgba(236, 72, 153, 0.3)" }}>
              
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <img
                  src="/logo.png"
                  alt="Logo"
                  style={{ width: "100px", height: "100px", objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(236,72,153,0.6))" }}
                  onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                />
                <h2 style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#fff", margin: 0 }}>Bem-vindo(a)</h2>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Faça login para sincronizar seu perfil e avaliações na nuvem.</p>
              </div>

              <button
                onClick={handleGoogleLogin}
                style={{ backgroundColor: "#ffffff", color: "#0f172a", border: "none", borderRadius: "0.85rem", padding: "0.95rem 1.25rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}
              >
                <svg style={{ width: "1.2rem", height: "1.2rem" }} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.22 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Continuar com o Google
              </button>
            </div>
          </div>
        )}

        {/* TELA DE MODOS */}
        {authState === "modes" && !selectedMode && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "85vh", gap: "2.5rem", textAlign: "center" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", maxWidth: "800px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <img src={userAvatar} alt="Avatar" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", border: "2px solid #ec4899" }} />
                <span style={{ fontSize: "1rem", color: "#fff", fontWeight: "bold" }}>{userName}</span>
              </div>
              <button onClick={handleLogout} style={{ background: "none", border: "1px solid #334155", color: "#94a3b8", padding: "0.5rem 1rem", borderRadius: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
                <LogOut style={{ width: "1rem", height: "1rem" }} /> Sair da Conta
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#ec4899", margin: 0, textTransform: "uppercase" }}>
                {userName}
              </h1>
              <p style={{ color: "#22d3ee", fontSize: "1rem", margin: 0, letterSpacing: "2px", fontWeight: "600" }}>
                ESCOLHA O MODO DE AVALIAÇÃO
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", width: "100%" }}>
              <button
                onClick={() => setSelectedMode("solo")}
                style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(236, 72, 153, 0.5)", borderRadius: "1.5rem", padding: "1.75rem", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
              >
                <User style={{ width: "2.25rem", height: "2.25rem", color: "#ec4899" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#ec4899", margin: 0 }}>Solo</h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Avaliações individuais.</p>
              </button>

              <button
                onClick={() => setSelectedMode("duo")}
                style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(34, 211, 238, 0.5)", borderRadius: "1.5rem", padding: "1.75rem", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
              >
                <Heart style={{ width: "2.25rem", height: "2.25rem", color: "#22d3ee" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#22d3ee", margin: 0 }}>Casalzinho</h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Avaliação conjunta.</p>
              </button>

              <button
                onClick={() => setSelectedMode("grupo")}
                style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(234, 179, 8, 0.5)", borderRadius: "1.5rem", padding: "1.75rem", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
              >
                <Users style={{ width: "2.25rem", height: "2.25rem", color: "#eab308" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#eab308", margin: 0 }}>Grupinho</h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Avaliação em grupo.</p>
              </button>
            </div>
          </div>
        )}

        {/* TELA DE CONFIGURAÇÃO DE SALA */}
        {authState === "modes" && selectedMode && selectedMode !== "solo" && !customRoomCode && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "75vh", justifyContent: "center", gap: "1.5rem" }}>
            <button onClick={() => setSelectedMode(null)} style={{ background: "none", border: "none", color: "#ec4899", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
              <ArrowLeft style={{ width: "1.1rem", height: "1.1rem" }} /> Voltar
            </button>

            <div style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(34, 211, 238, 0.5)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "420px", textAlign: "center", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h2 style={{ color: "#22d3ee", margin: 0, fontSize: "1.4rem" }}>Configurar {selectedMode === "duo" ? "Casalzinho" : "Grupinho"}</h2>

              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#ec4899", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Seu Nome:</label>
                  <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ width: "100%", backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem", color: "#fff", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#22d3ee", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Nome do(a) Parceiro(a) / Amigo(a):</label>
                  <input type="text" placeholder="Digite o nome..." value={partnerName} onChange={(e) => setPartnerName(e.target.value)} style={{ width: "100%", backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem", color: "#fff", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#eab308", fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>Código da Sala:</label>
                  <input type="text" placeholder="EX: SESSAO123" value={customRoomCode} onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())} style={{ width: "100%", backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.75rem", color: "#fff", textTransform: "uppercase", boxSizing: "border-box" }} />
                </div>
              </div>

              <button onClick={handleGenerateRandomCode} style={{ background: "none", border: "none", color: "#22d3ee", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}>
                ⚡ Gerar código aleatório
              </button>

              <button
                onClick={() => {
                  if (!customRoomCode.trim()) { alert("Digite um código de sala!"); return; }
                  setAuthState("app");
                }}
                style={{ backgroundColor: "#06b6d4", color: "#020617", border: "none", borderRadius: "0.75rem", padding: "0.85rem", fontWeight: "bold", cursor: "pointer" }}
              >
                ENTRAR NA SESSÃO
              </button>
            </div>
          </div>
        )}

        {/* APLICATIVO PRINCIPAL */}
        {(authState === "app" || (authState === "modes" && selectedMode === "solo") || (authState === "modes" && selectedMode && customRoomCode)) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(236,72,153,0.4)", padding: "1rem 1.25rem", borderRadius: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button onClick={() => { setAuthState("modes"); setSelectedMode(null); setCustomRoomCode(""); }} style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.5rem", color: "#ec4899", cursor: "pointer" }}>
                  <ArrowLeft style={{ width: "1.2rem", height: "1.2rem" }} />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <img src={userAvatar} alt="Avatar" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #ec4899" }} />
                  <div>
                    <h1 style={{ fontSize: "1.1rem", color: "#ec4899", margin: 0, fontWeight: "bold", textTransform: "uppercase" }}>
                      {userName}
                    </h1>
                    <span style={{ fontSize: "0.7rem", color: "#22d3ee", textTransform: "uppercase", fontWeight: "bold" }}>
                      {selectedMode ? `${selectedMode} ${customRoomCode ? `(${customRoomCode})` : ""}` : "Perfil Ativo"}
                    </span>
                  </div>
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

            {activeView === "podio" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "3rem", textAlign: "center" }}>
                
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

            {activeView === "perfil" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                <div style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(236,72,153,0.4)", borderRadius: "1.5rem", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", textAlign: "center" }}>
                  <img src={userAvatar} alt="Avatar Pet" style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "3px solid #ec4899", boxShadow: "0 0 15px rgba(236,72,153,0.4)" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", maxWidth: "300px" }}>
                    <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "bold" }}>Seu Nome / Apelido:</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      style={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "0.75rem", padding: "0.6rem", color: "#fff", textAlign: "center", fontWeight: "bold", outline: "none" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
                    <span style={{ fontSize: "0.8rem", color: "#22d3ee", fontWeight: "bold" }}>Escolha seu Avatar de Bichinho:</span>
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      {PET_AVATARS.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="Pet Preset"
                          onClick={() => setUserAvatar(url)}
                          style={{ width: "55px", height: "55px", borderRadius: "50%", objectFit: "cover", cursor: "pointer", border: userAvatar === url ? "3px solid #22d3ee" : "2px solid transparent" }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleShareProfileLink}
                    style={{ backgroundColor: "#06b6d4", color: "#020617", border: "none", borderRadius: "0.75rem", padding: "0.75rem 1.5rem", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginTop: "0.5rem" }}
                  >
                    <Share2 style={{ width: "1rem", height: "1rem" }} /> Compartilhar Link do Meu Perfil
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

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#ec4899", fontWeight: "bold" }}>Nota de {userName.trim() || "Usuário"}: {rating} / 10 ★</span>
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
