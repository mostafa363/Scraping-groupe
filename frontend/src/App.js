import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/movies')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des films');
        }
        return response.json();
      })
      .then((data) => {
        setMovies(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Liste des films</h1>
        {loading && <p>Chargement...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          <table style={{ width: '80%', margin: 'auto', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Titre</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Année</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Note</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Genres</th>
              </tr>
            </thead>
            <tbody>
              {movies.map((movie) => (
                <tr key={movie.id || movie._id}>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{movie.title}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{movie.year}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{movie.rating}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{movie.genres}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </header>
    </div>
  );
}

export default App;
