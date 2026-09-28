'use client';

import React, { useState, useEffect } from 'react';
import { 
  Film, Users, User, Heart, Star, QrCode, ArrowLeft, 
  Trophy, Share2, Plus, Search, CheckCircle, Copy, LogOut
} from 'lucide-react';

type ScreenState = 'menu' | 'solo' | 'duo' | 'group' | 'library';

interface MediaItem {
  id: number;
  title: string;
  poster_path: string;
  release_date?: string;
  vote_average?: number;
  overview?: string;
}

interface UserRating {
  mediaId: number;
  title: string;
  poster: string;
  rating: number;
  timestamp: string;
}

export default function DitoEFeito() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [myRatings, setMyRatings] = useState<UserRating[]>([]);
  
  // Estados do Duo / Grupo
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [roomRatings, setRoomRatings] = useState<{ [user: string]: number }>({});
  const [showPodium, setShowPodium] = useState<boolean>(false);

  // Carregar biblioteca do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem('ditoefeito_ratings');
    if (saved) {
      try { setMyRatings(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Buscar filmes/séries no TMDB via busca interna
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=f387a8d39e74287934d786c1f2c2fe57&language=pt-BR&query=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        if (data.results) {
          const filtered = data.results.filter(
            (item: any) => item.media_type === 'movie' || item.media_type === 'tv'
          ).map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
            release_date: item.release_date || item.first_air_date,
            vote_average: item.vote_average,
            overview: item.overview
          }));
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error('Erro na busca do TMDB:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Função para criar uma sala Duo/Grupo
  const createRoom = (mode: 'duo' | 'group') => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setIsHost(true);
    setParticipants([userName || 'Anfitrião']);
    setCurrentScreen(mode);
  };

  // Entrar em uma sala existente
  const joinRoom = (mode: 'duo' | 'group') => {
    if (!inputCode) return;
    setRoomCode(inputCode.toUpperCase());
    setIsHost(false);
    setParticipants(['Anfitrião', userName || 'Convidado']);
    setCurrentScreen(mode);
  };

  // Salvar avaliação Solo
  const saveSoloRating = () => {
    if (!selectedMedia || rating === 0) return;
    const newRating: UserRating = {
      mediaId: selectedMedia.id,
      title: selectedMedia.title,
      poster: selectedMedia.poster_path,
      rating,
      timestamp: new Date().toLocaleDateString('pt-BR')
    };

    const updated = [newRating, ...myRatings.filter(r => r.mediaId !== selectedMedia.id)];
    setMyRatings(updated);
    localStorage.setItem('ditoefeito_ratings', JSON.stringify(updated));
    setSelectedMedia(null);
    setRating(0);
    setSearchQuery('');
    alert('Avaliação salva com sucesso na sua biblioteca!');
  };

  // Voltar ao menu e resetar seleção
  const goBackToMenu = () => {
    setCurrentScreen('menu');
    setSelectedMedia(null);
    setRating(0);
    setSearchQuery('');
    setShowPodium(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Fixo */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={goBackToMenu}>
          <Film className="w-6 h-6 text-indigo-500" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">
            Dito & Feito
          </h1>
        </div>

        {currentScreen !== 'menu' && (
          <button 
            onClick={goBackToMenu}
            className="flex items-center gap-1 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Menu
          </button>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col">
        
        {/* TELA: MENU PRINCIPAL */}
        {currentScreen === 'menu' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 py-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold sm:text-4xl">Avalie Filmes & Séries em Conjunto</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Escolha o modo, assista junto com amigos ou namorado(a) e descubram a nota final sincronizada!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
              {/* Opção Solo */}
              <div 
                onClick={() => setCurrentScreen('solo')}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl cursor-pointer transition flex flex-col items-center text-center group"
              >
                <User className="w-10 h-10 text-indigo-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="text-lg font-bold">Modo Solo</h3>
                <p className="text-xs text-slate-400 mt-1">Avalie e guarde suas notas pessoais na sua biblioteca.</p>
              </div>

              {/* Opção Duo */}
              <div 
                onClick={() => setCurrentScreen('duo')}
                className="bg-slate-900 border border-slate-800 hover:border-pink-500/50 p-6 rounded-2xl cursor-pointer transition flex flex-col items-center text-center group"
              >
                <Heart className="w-10 h-10 text-pink-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="text-lg font-bold">Modo Dupla (Duo)</h3>
                <p className="text-xs text-slate-400 mt-1">Conecte via QR Code ou Código e avaliem a dois.</p>
              </div>

              {/* Opção Grupo */}
              <div 
                onClick={() => setCurrentScreen('group')}
                className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-6 rounded-2xl cursor-pointer transition flex flex-col items-center text-center group"
              >
                <Users className="w-10 h-10 text-purple-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="text-lg font-bold">Modo Grupo</h3>
                <p className="text-xs text-slate-400 mt-1">Crie salas para até 10 pessoas com pódio de notas.</p>
              </div>

              {/* Opção Biblioteca */}
              <div 
                onClick={() => setCurrentScreen('library')}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition flex flex-col items-center text-center group"
              >
                <Trophy className="w-10 h-10 text-emerald-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="text-lg font-bold">Minha Biblioteca</h3>
                <p className="text-xs text-slate-400 mt-1">Veja todos os filmes/séries que você já avaliou.</p>
              </div>
            </div>
          </div>
        )}

        {/* TELA: MODO SOLO */}
        {currentScreen === 'solo' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <User className="text-indigo-400" /> Avaliação Solo
            </h2>

            {/* Busca de Filmes */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Busque por um filme ou série..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Resultados da Busca */}
            {searchResults.length > 0 && !selectedMedia && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {searchResults.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedMedia(item)}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-500 transition flex flex-col"
                  >
                    {item.poster_path ? (
                      <img src={item.poster_path} alt={item.title} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-slate-800 flex items-center justify-center text-xs text-slate-500">Sem Foto</div>
                    )}
                    <div className="p-3">
                      <p className="font-bold text-sm truncate">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.release_date?.substring(0, 4)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filme Selecionado & Votação */}
            {selectedMedia && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center">
                {selectedMedia.poster_path && (
                  <img src={selectedMedia.poster_path} alt={selectedMedia.title} className="w-36 h-52 object-cover rounded-xl" />
                )}
                <div className="space-y-4 flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold">{selectedMedia.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3">{selectedMedia.overview}</p>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Sua Nota (0 a 10):</p>
                    <div className="flex items-center gap-1 justify-center sm:justify-start">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => setRating(num)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                            rating >= num ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center sm:justify-start pt-2">
                    <button 
                      onClick={saveSoloRating}
                      disabled={rating === 0}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
                    >
                      Salvar Nota
                    </button>
                    <button 
                      onClick={() => setSelectedMedia(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm transition"
                    >
                      Trocar Filme
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TELA: MODO DUPLA & GRUPO */}
        {(currentScreen === 'duo' || currentScreen === 'group') && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {currentScreen === 'duo' ? <Heart className="text-pink-400" /> : <Users className="text-purple-400" />}
              {currentScreen === 'duo' ? 'Modo Dupla (Duo)' : 'Modo Grupo (Até 10 Pessoas)'}
            </h2>

            {!roomCode ? (
              /* Criar ou Entrar em Sala */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto py-6">
                {/* Criar Sala */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 text-center">
                  <h3 className="font-bold text-lg">Criar uma Nova Sala</h3>
                  <input 
                    type="text" 
                    placeholder="Seu Nome/Apelido" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-center"
                  />
                  <button 
                    onClick={() => createRoom(currentScreen)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    Gerar Sala & Código
                  </button>
                </div>

                {/* Entrar em Sala */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 text-center">
                  <h3 className="font-bold text-lg">Entrar em Sala Existente</h3>
                  <input 
                    type="text" 
                    placeholder="Seu Nome/Apelido" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-center"
                  />
                  <input 
                    type="text" 
                    placeholder="Código da Sala (Ex: X7A9B)" 
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-center uppercase"
                  />
                  <button 
                    onClick={() => joinRoom(currentScreen)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    Entrar na Sala
                  </button>
                </div>
              </div>
            ) : (
              /* Dentro da Sala Criada */
              <div className="space-y-6">
                {/* Card do Código / QR Code */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Código de Acesso da Sala:</p>
                    <p className="text-3xl font-mono font-extrabold text-indigo-400 tracking-widest">{roomCode}</p>
                    <p className="text-xs text-slate-500 mt-1">{isHost ? 'Você é o Host (Anfitrião)' : 'Você entrou como participante'}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl flex items-center justify-center">
                      {/* Simulação Visual do QR Code */}
                      <QrCode className="w-16 h-16 text-slate-900" />
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(roomCode)}
                      className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl text-slate-300"
                      title="Copiar Código"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Lista de Participantes */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-slate-400 mb-2">Participantes Conectados ({participants.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {participants.map((p, idx) => (
                      <span key={idx} className="bg-slate-800 border border-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400" /> {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Busca e Escolha do Filme para a Sala */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Escolher Filme para Avaliação da Sala</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Buscar filme/série para a sala..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {searchResults.length > 0 && !selectedMedia && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {searchResults.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedMedia(item)}
                          className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-500 transition"
                        >
                          {item.poster_path && <img src={item.poster_path} alt={item.title} className="w-full h-40 object-cover" />}
                          <div className="p-2 text-xs font-bold truncate">{item.title}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedMedia && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                      <h4 className="text-xl font-bold">Votação em Grupo: {selectedMedia.title}</h4>
                      <div className="flex items-center gap-1 justify-center">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <button
                            key={num}
                            onClick={() => setRating(num)}
                            className={`w-9 h-9 rounded-lg font-bold ${rating === num ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => setShowPodium(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition"
                      >
                        Revelar Média e Pódio
                      </button>
                    </div>
                  )}

                  {/* Pódio e Resultados */}
                  {showPodium && selectedMedia && (
                    <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
                      <Trophy className="w-12 h-12 text-yellow-400 mx-auto" />
                      <h3 className="text-2xl font-extrabold">Resultado Final</h3>
                      <p className="text-slate-300">
                        Média da Sala: <span className="text-3xl font-extrabold text-emerald-400">8.5</span> / 10
                      </p>

                      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-4 text-xs font-bold">
                        <div className="bg-slate-800 p-3 rounded-xl border border-amber-600/50">
                          <p className="text-amber-500">2º Lugar</p>
                          <p className="text-slate-200 mt-1">{participants[1] || 'Convidado'}</p>
                          <p className="text-slate-400">8.0</p>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-xl border border-yellow-400">
                          <p className="text-yellow-400">1º Lugar</p>
                          <p className="text-slate-200 mt-1">{participants[0] || 'Anfitrião'}</p>
                          <p className="text-slate-400">9.0</p>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-xl border border-amber-800/50">
                          <p className="text-amber-700">3º Lugar</p>
                          <p className="text-slate-200 mt-1">Sua Nota</p>
                          <p className="text-slate-400">{rating || 8}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TELA: MINHA BIBLIOTECA */}
        {currentScreen === 'library' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="text-emerald-400" /> Minha Biblioteca de Notas
            </h2>

            {myRatings.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Você ainda não salvou nenhuma avaliação no modo Solo.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myRatings.map((item, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    {item.poster && <img src={item.poster} alt={item.title} className="w-16 h-24 object-cover rounded-lg" />}
                    <div>
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="text-xs text-slate-400">Avaliado em: {item.timestamp}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-sm text-slate-100">{item.rating} / 10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}