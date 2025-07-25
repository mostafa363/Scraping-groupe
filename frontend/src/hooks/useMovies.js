// src/hooks/useMovies.js
 
import { useState, useEffect, useCallback } from 'react';
import { getMovies, searchMovies } from '../services/api';
 
const PAGE_SIZE = 24;
 
// Voici notre hook personnalisé !
export const useMovies = (filters) => {
  const [allMovies, setAllMovies] = useState([]);
  const [visibleMovies, setVisibleMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canLoadMore, setCanLoadMore] = useState(true);
 
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const effectiveFilters = { ...filters };
      Object.keys(effectiveFilters).forEach(key => {
        if (effectiveFilters[key] === '' || effectiveFilters[key] === null) delete effectiveFilters[key];
      });
 
      const response = effectiveFilters.title
        ? await searchMovies(effectiveFilters.title)
        : await getMovies(effectiveFilters);
     
      const fetchedMovies = response.data;
      setAllMovies(fetchedMovies);
      setVisibleMovies(fetchedMovies.slice(0, PAGE_SIZE));
      setCanLoadMore(fetchedMovies.length > PAGE_SIZE);
 
    } catch (err) {
      const errorMsg = err.response?.status === 404
        ? 'No movies found matching your criteria.'
        : 'Could not fetch movies. Is the backend server running?';
      setError(errorMsg);
      setAllMovies([]);
      setVisibleMovies([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);
 
  useEffect(() => {
    const handler = setTimeout(() => { fetchMovies(); }, 500);
    return () => clearTimeout(handler);
  }, [fetchMovies]);
 
  const handleLoadMore = () => {
    const currentLength = visibleMovies.length;
    const nextMovies = allMovies.slice(currentLength, currentLength + PAGE_SIZE);
    setVisibleMovies(prev => [...prev, ...nextMovies]);
    if (currentLength + PAGE_SIZE >= allMovies.length) {
      setCanLoadMore(false);
    }
  };
 
  // Le hook retourne un objet avec toutes les valeurs et fonctions dont l'UI a besoin
  return { allMovies, visibleMovies, loading, error, canLoadMore, handleLoadMore };
};```
 
**2. Remplacez le contenu de `src/pages/HomePage.jsx` :**
 
Regardez comme ce fichier devient plus court et plus simple ! Il ne se préoccupe plus de *comment* les données sont récupérées, seulement de les afficher.
 
```javascript
// src/pages/HomePage.jsx
 
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Box, Container, Typography, Grid, CircularProgress, Button, Fade, Grow } from '@mui/material';
import { useMovies } from '../hooks/useMovies'; // <-- On importe notre nouveau hook !
 
// Les composants restent les mêmes
import HeroSection from '../components/HeroSection';
import Charts from '../components/Charts';
import MovieCard from '../components/MovieCard';
import MovieDetailModal from '../components/MovieDetailModal';
import SummaryStats from '../components/SummaryStats';
 
const HomePage = () => {
  const [filters] = useOutletContext();
 
  // TOUTE la logique de données est maintenant contenue dans cette seule ligne !
  const { allMovies, visibleMovies, loading, error, canLoadMore, handleLoadMore } = useMovies(filters);
 
  // La logique de la modale, qui est purement UI, reste ici.
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = (movie) => { setSelectedMovie(movie); setIsModalOpen(true); };
  const handleCloseModal = () => setIsModalOpen(false);
 
  return (
    <>
      <Container maxWidth={false} sx={{ py: 0, px: 0 }}>
        {/* Le JSX d'affichage reste exactement le même, il n'y a rien à changer ici. */}
        {/* Il utilise simplement les variables fournies par notre hook `useMovies`. */}
 
        {!loading && allMovies.length > 0 && (
          <Fade in={true} timeout={1000}><Box><HeroSection movie={allMovies[0]} onClick={() => handleOpenModal(allMovies[0])} /></Box></Fade>
        )}
       
        {!loading && allMovies.length > 0 && (
          <Box sx={{ px: { xs: 2, md: 4 }, py: 6, bgcolor: 'background.paper' }}><Grow in={true} timeout={1200}><Box><SummaryStats movies={allMovies} /></Box></Grow></Box>
        )}
 
        {!loading && allMovies.length > 0 && (
          <Box sx={{ px: { xs: 2, md: 4 }, py: 6 }}><Fade in={true} timeout={1400}><Box><Charts movies={allMovies} /></Box></Fade></Box>
        )}
 
        <Box sx={{ px: { xs: 2, md: 4 }, py: 6, bgcolor: 'background.paper' }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2, fontFamily: '"Cinzel", serif' }}>🎬 Featured Movies</Typography>
            <Box sx={{ width: 100, height: 4, background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.error.main})`, margin: '0 auto', borderRadius: 2 }} />
          </Box>
 
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 10, minHeight: '300px' }}>
              <CircularProgress size={60} sx={{ color: 'primary.main', mb: 3 }} />
              <Typography>Loading cinematic masterpieces...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', my: 10, p: 4, borderRadius: 2, bgcolor: 'rgba(196, 30, 58, 0.1)', border: '1px solid rgba(196, 30, 58, 0.3)' }}>
              <Typography variant="h6" color="error" sx={{ mb: 2, fontWeight: 'bold' }}>🎭 Oops! Something went wrong</Typography>
              <Typography>{error}</Typography>
            </Box>
          ) : (
            <>
              <Fade in={true} timeout={1600}>
                <Grid container spacing={4} justifyContent="center">
                  {visibleMovies.map((movie, index) => (
                    <Grid key={movie.id} item xs={12} sm={6} md={4} lg={3} xl={2.4}>
                      <Grow in={true} timeout={1000 + (index % 12) * 100} style={{ transformOrigin: '0 0 0' }}><Box><MovieCard movie={movie} onClick={() => handleOpenModal(movie)} /></Box></Grow>
                    </Grid>
                  ))}
                </Grid>
              </Fade>
              {canLoadMore && (
                <Fade in={true} timeout={2000}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <Button variant="contained" onClick={handleLoadMore} size="large" sx={{ fontWeight: 'bold', px: 4, py: 1.5 }}>🍿 Load More Movies</Button>
                  </Box>
                </Fade>
              )}
            </>
          )}
        </Box>
      </Container>
      <MovieDetailModal movie={selectedMovie} open={isModalOpen} handleClose={handleCloseModal} />
    </>
  );
};
 
export default HomePage;