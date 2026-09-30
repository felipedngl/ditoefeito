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
  getDoc, 
  collection, 
  getDocs 
} from "firebase/firestore";

// Configuração do Firebase (Certifique-se de preencher com as suas credenciais ou variáveis de ambiente)
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

// Categorias de Avatares de Bichinhos (Atualizado)
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
  
  // Estados do Perfil e Personalização (Layout Antigo + Firebase Atual)
  const [userName, setUserName] = useState("Dissa");
  const [partnerName, setPartnerName] = useState("Amor");
  const [selectedAvatar, setSelectedAvatar] = useState("🐶");
  const [selectedCategory, setSelectedCategory] = useState("Cachorros");
  
  // Estados de Avaliação (Com correção do bug do partnerRating)
  const [mainRating, setMainRating] = useState(5);
  const [partnerRating, setPartnerRating] = useState(5);

  // Controle de Autenticação com Google e sincronização com Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserName(currentUser.displayName || "Dissa");
        
        // Buscar dados salvos no Firestore
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.userName) setUserName(data.userName);
            if (data.partnerName) setPartnerName(data.partnerName);
            if (data.selectedAvatar) setSelectedAvatar(data.selectedAvatar);
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
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        userName,
        partnerName,
        selectedAvatar,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert("Dados salvos com sucesso no Firebase!");
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar dados.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="animate-pulse text-lg">A carregar o Hub Menchë...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 md:p-8">
      {/* Container Principal com Layout Amplo Inspirado no Antigo (Max-width 1000px) */}
      <div className="w-full max-w-[1000px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabeçalho */}
        <header className="p-6 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-900/50 backdrop-blur">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-indigo-400">Hub Menchë</h1>
            <p className="text-sm text-slate-400">Painel de Gestão e Conexão</p>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user.displayName}</p>
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
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                Entrar com Google
              </button>
            )}
          </div>
        </header>

        {/* Navegação por Abas (Layout Antigo Expandido) */}
        <nav className="flex border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab("home")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === "home"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Início & Perfil
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === "library"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Biblioteca & Catálogo
          </button>
        </nav>

        {/* Conteúdo das Abas */}
        <main className="p-6 md:p-8 flex-1">
          {activeTab === "home" ? (
            <div className="space-y-8">
              {/* Secção de Identidade e Avatares */}
              <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800/80">
                <h2 className="text-lg font-semibold mb-4 text-slate-200">Personalização do Perfil</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">O seu Nome</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Parceira / Parceiro</label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Seletor de Avatares Atualizado (Categorias de Bichinhos) */}
                <div className="mt-6">
                  <label className="block text-xs font-medium text-slate-400 mb-2">Escolha o seu Avatar de Bichinho</label>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {Object.keys(AVATAR_CATEGORIES).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 text-xs rounded-full transition ${
                          selectedCategory === cat 
                            ? "bg-indigo-600 text-white" 
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 text-2xl bg-slate-900 p-3 rounded-lg border border-slate-800 w-fit">
                    {(AVATAR_CATEGORIES as any)[selectedCategory].map((emoji: string) => (
                      <button
                        key={emoji}
                        onClick={() => setSelectedAvatar(emoji)}
                        className={`p-2 rounded-lg transition hover:scale-110 ${
                          selectedAvatar === emoji ? "bg-indigo-500/30 border border-indigo-500" : ""
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {user && (
                  <button
                    onClick={saveData}
                    className="mt-6 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition shadow-lg shadow-emerald-600/20"
                  >
                    Salvar Alterações no Firebase
                  </button>
                )}
              </div>

              {/* Bloco de Avaliações (Correção do Bug de Rating do Parceiro) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800/80">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Avaliação Principal ({userName})</h3>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setMainRating(star)}
                        className={`text-xl ${star <= mainRating ? "text-amber-400" : "text-slate-700"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800/80">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Avaliação do Parceiro ({partnerName})</h3>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setPartnerRating(star)}
                        className={`text-xl ${star <= partnerRating ? "text-amber-400" : "text-slate-700"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-200">Biblioteca Integrada</h2>
              <p className="text-sm text-slate-400">
                Aqui podes consultar os recursos de projetos, referências de design e módulos de catálogo do Menchë.
              </p>
              <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center py-12">
                <p className="text-slate-500 text-sm">Nenhum registo extra na biblioteca carregado de momento.</p>
              </div>
            </div>
          )}
        </main>

        {/* Rodapé */}
        <footer className="p-4 border-t border-slate-800 text-center text-xs text-slate-500 bg-slate-950/40">
          Hub Menchë &copy; 2026 — Sincronizado via Firebase
        </footer>

      </div>
    </div>
  );
}
