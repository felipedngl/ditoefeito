'use client';

import { useState } from 'react';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  const searchMovies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=f387a8d39e74287934d786c1f2c2fe57&language=pt-BR&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      setMovies(data.results || []);
    } catch (err) {
      console.error('Erro ao buscar títulos:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1 className="title">Dito & Feito</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Pesquise filmes e séries para avaliar com a galera!
        </p>
      </header>

      <section className="card">
        <form onSubmit={searchMovies} className="input-group">
          <input
            type="text"
            placeholder="Digite o nome de um filme ou série..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        <div className="grid">
          {movies.map((movie) => {
            const title = movie.title || movie.name || 'Sem título';
            const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
            const poster = movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : 'https://via.placeholder.com/500x750?text=Sem+Imagem';

            return (
              <div key={movie.id} className="movie-card">
                <img src={poster} alt={title} className="movie-poster" />
                <div className="movie-info">
                  <div className="movie-title">{title}</div>
                  {year && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {year}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}