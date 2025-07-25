// src/App.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Typography, Grid, CircularProgress, Button } from '@mui/material';
import { getMovies, searchMovies } from './services/api';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Charts from './components/Charts';
import MovieCard from './components/MovieCard';
import MovieDetailModal from './components/MovieDetailModal';
import Footer from './components/Footer';
import SummaryStats from './components/SummaryStats';

const PAGE_SIZE = 24;

const API_BASE = "http://localhost:8000";

function App() {
  const [allMovies, setAllMovies] = useState([]);
  const [visibleMovies, setVisibleMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({ limit: 250, sort_by: 'imdb_rating', order: 'desc', min_rating: '', min_year: '', title: '' });

  const handleOpenModal = (movie) => { setSelectedMovie(movie); setIsModalOpen(true); };
  const handleCloseModal = () => setIsModalOpen(false);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      let response;
      const effectiveFilters = { ...filters }; // Create a copy of filters
      
      // Use search endpoint if title is present, otherwise use filter endpoint
      if (effectiveFilters.title) {
        response = await searchMovies(effectiveFilters.title);
      } else {
        // Remove empty filters so they don't get sent to the API
        Object.keys(effectiveFilters).forEach(key => {
          if (effectiveFilters[key] === '' || effectiveFilters[key] === null) {
            delete effectiveFilters[key];
          }
        });
        response = await getMovies(effectiveFilters);
      }
      
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



  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar filters={filters} setFilters={setFilters} movies={allMovies} />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
          
          {!loading && allMovies.length > 0 && <HeroSection movie={allMovies[0]} onClick={() => handleOpenModal(allMovies[0])} />}
          
          {/* Charts are now part of the main flow */}
          {!loading && allMovies.length > 0 && <SummaryStats movies={allMovies} />}
          {!loading && allMovies.length > 0 && <Charts movies={allMovies} />}
           

          {/* Title for the movie grid section */}
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
            Movies
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}><CircularProgress /></Box>
          ) : error ? (
            <Typography color="error" sx={{ textAlign: 'center', my: 10 }}>{error}</Typography>
          ) : (
            <>
              <Grid container spacing={3} justifyContent="center">
                {visibleMovies.map(movie => (
                  <Grid key={movie.id} xs={12} sm={6} md={4} lg={3} xl={2.4}>
                    <MovieCard movie={movie} onClick={() => handleOpenModal(movie)} />
                  </Grid>
                ))}
              </Grid>
              
              {canLoadMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Button variant="contained" onClick={handleLoadMore}>Load More</Button>
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>

      <MovieDetailModal movie={selectedMovie} open={isModalOpen} handleClose={handleCloseModal} />
      <Footer />
    </Box>
  );
}

export default App;