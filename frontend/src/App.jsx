// src/App.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Typography, Grid, CircularProgress, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
const sortOptions = [
  { value: 'imdb_rating', label: 'IMDb Rating' },
  { value: 'tomatometer_score', label: 'Tomatometer' },
  { value: 'year', label: 'Release Year' },
  { value: 'runtime_minutes', label: 'Runtime' },
  { value: 'discrepancy', label: 'Rating Discrepancy' },
];
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
           

          {/* Sort and order controls above the movie grid */}
          <Box sx={{ height: 32 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                Movies
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  name="sort_by"
                  value={filters.sort_by || 'imdb_rating'}
                  onChange={e => setFilters(prev => ({ ...prev, sort_by: e.target.value }))}
                  label="Sort By"
                >
                  {sortOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Order</InputLabel>
                <Select
                  name="order"
                  value={filters.order || 'desc'}
                  onChange={e => setFilters(prev => ({ ...prev, order: e.target.value }))}
                  label="Order"
                >
                  <MenuItem value="desc">Desc</MenuItem>
                  <MenuItem value="asc">Asc</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel shrink>Min Year</InputLabel>
                <input
                  type="number"
                  name="min_year"
                  value={filters.min_year || ''}
                  onChange={e => setFilters(prev => ({ ...prev, min_year: e.target.value }))}
                  placeholder="Min Year"
                  style={{ padding: '8.5px 14px', borderRadius: 4, border: '1px solid #ccc', fontSize: 16, width: '100%' }}
                />
              </FormControl>
            </Box>
          </Box>

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