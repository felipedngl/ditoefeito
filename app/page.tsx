"use client";

import React, { useState, useEffect } from "react";
import { 
  initializeApp, 
  getApps 
} from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForBuild",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "seu-projeto.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "seu-projeto",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "seu-projeto.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123:web:abc"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// Categorias completas de Avatares de Bichinhos
const AVATAR_CATEGORIES = {
  Cachorros: ["🐶", "🐕", "🦮", "🐩", "🐾"],
  Gatos: ["🐱", "🐈", "🐈‍⬛"],
  Cavalos: ["🐴", "🐎", "🦄"],
  Lontras: ["🦦"],
  Passarinhos: ["🐦", "🦜", "🕊️", "🐧", "🦉"],
  Coelhinhos: ["🐰", "🐇"]
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  
  // Estados de Perfil e Personalização
  const [userName, setUserName] = useState("Dissa");
  const [partnerName, setPartnerName] = useState("Amor");
  const [selectedAvatar, setSelectedAvatar] = useState("🐶");
  const [selectedCategory, setSelectedCategory] = useState("Cachorros");
  
  // Estados de Avaliação (Com correção do bug do partnerRating)
  const [mainRating, setMainRating] = useState(5);
  const [partnerRating, setPartnerRating] = useState(5);

  // Estados de Conteúdo da Biblioteca e Gestão (Resgate do Layout Antigo)
  const [librarySearch, setLibrarySearch] = useState("");
  const [notes, setNotes] = useState("");
  const [savedNotesList, setSavedNotesList] = useState<string[]>([]);

  // Controle de Autenticação com Google e sincronização com Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserName(currentUser.displayName || "Dissa");
        
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.userName) setUserName(data.userName);
            if (data.partnerName) setPartnerName(data.partnerName);
            if (data.selectedAvatar) setSelectedAvatar(data.selectedAvatar);
            if (data.savedNotesList) setSavedNotesList(data.savedNotesList);
          }
        } catch (error) {
          console.error("Erro ao carregar dados do Firestore:", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro no login com Google:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const saveData = async () => {
    if (!user) {
      alert("Precisas de estar autenticado com o Google para salvar no Firebase.");
      return;
    }
    try {
      await setDoc(doc(db, "users", user.uid), {
        userName,
        partnerName,
        selectedAvatar,
        savedNotesList,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert("Dados sincronizados e salvos com sucesso no Firebase!");
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar dados no Firebase.");
    }
  };

  const handleAddNote = () => {
    if (!notes.trim()) return;
    const updated = [notes, ...savedNotesList];
    setSavedNotesList(updated);
    setNotes("");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium tracking-wide text-slate-400">A carregar o Hub Menchë...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 md:p-8">
      {/* Container Principal com Layout Amplo e Espaçado (Max-width 1000px) */}
      <div className="w-full max-w-[1000px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabeçalho */}
        <header className="p-6 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">{selectedAvatar}</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-indigo-400">Hub Menchë</h1>
              <p className="text-xs text-slate-400">Painel de Gestão, Conexão e Biblioteca</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{userName}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-600/30 transition"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center gap-2"
              >
                <span>🔑</span> Entrar com Google
              </button>
            )}
          </div>
        </header>

        {/* Navegação por Abas (Estrutura Completa do Antigo) */}
        <nav className="flex border-b border-slate-800 bg-slate-950/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab("home")}
            className={`px-6 py-3.5 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "home"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🏠</span> Início & Perfil
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`px-6 py-3.5 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "library"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📚</span> Biblioteca & Notas
          </button>
        </nav>

        {/* Conteúdo Principal */}
        <main className="p-6 md:p-8 flex-1 bg-slate-900/30">
          {activeTab === "home" ? (
            <div className="space-y-8">
              
              {/* Secção de Identidade e Configuração de Perfil */}
              <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 shadow-lg">
                <h2 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
                  <span>⚙️</span> Personalização de Identidade
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">O seu Nome</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Nome da Parceira / Parceiro</label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Seletor de Avatares por Categorias de Bichinhos */}
                <div className="mt-6">
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Escolha o seu Avatar de Bichinho</label>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {Object.keys(AVATAR_CATEGORIES).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                          selectedCategory === cat 
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                            : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 text-2xl bg-slate-900 p-3.5 rounded-xl border border-slate-800 w-fit shadow-inner">
                    {(AVATAR_CATEGORIES as any)[selectedCategory].map((emoji: string) => (
                      <button
                        key={emoji}
                        onClick={() => setSelectedAvatar(emoji)}
                        className={`p-2 rounded-lg transition transform hover:scale-110 ${
                          selectedAvatar === emoji ? "bg-indigo-500/30 border border-indigo-500 shadow" : "hover:bg-slate-800"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveData}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                  >
                    <span>💾</span> Salvar Dados no Firebase
                  </button>
                </div>
              </div>

              {/* Secção de Avaliações (Bug corrigido: partnerRating independente) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 shadow-lg">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
                    <span>Avaliação Principal ({userName})</span>
                    <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md">{mainRating}/5</span>
                  </h3>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setMainRating(star)}
                        className={`text-2xl transition transform hover:scale-110 ${star <= mainRating ? "text-amber-400 drop-shadow" : "text-slate-700"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 shadow-lg">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
                    <span>Avaliação do Parceiro ({partnerName})</span>
                    <span className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded-md">{partnerRating}/5</span>
                  </h3>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setPartnerRating(star)}
                        className={`text-2xl transition transform hover:scale-110 ${star <= partnerRating ? "text-amber-400 drop-shadow" : "text-slate-700"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 shadow-lg space-y-4">
                <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <span>📚</span> Biblioteca & Gestão de Notas do Hub
                </h2>
                <p className="text-sm text-slate-400">
                  Adiciona notas rápidas, links ou referências para consultar a qualquer momento.
                </p>

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Escreve uma nova nota ou referência..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-indigo-600/20"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {savedNotesList.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-6 text-center">Nenhuma nota guardada ainda.</p>
                  ) : (
                    savedNotesList.map((item, index) => (
                      <div key={index} className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-200 flex justify-between items-center">
                        <span>{item}</span>
                        <button
                          onClick={() => {
                            const filtered = savedNotesList.filter((_, i) => i !== index);
                            setSavedNotesList(filtered);
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-500/10 rounded-lg transition"
                        >
                          Remover
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Rodapé */}
        <footer className="p-4 border-t border-slate-800 text-center text-xs text-slate-500 bg-slate-950/60">
          Hub Menchë &copy; 2026 — Sincronização Ativa via Firebase & Google Auth
        </footer>

      </div>
    </div>
  );
}
