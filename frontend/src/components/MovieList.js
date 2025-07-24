import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';

const API_BASE = 'http://localhost:8000';

const sortOptions = [
  { value: 'imdb_rating', label: 'IMDb Rating' },
  { value: 'tomatometer_score', label: 'Tomatometer' },
  { value: 'year', label: 'Year' },
  { value: 'runtime_minutes', label: 'Runtime' },
];

export default function MovieList() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minYear, setMinYear] = useState('');
  const [sortBy, setSortBy] = useState('imdb_rating');
  const [order, setOrder] = useState('desc');
  const [error, setError] = useState('');

  // Fetch all movies on mount
  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async (params = {}) => {
    setLoading(true);
    setError('');
    let url = `${API_BASE}/movies`;
    let query = [];
    if (params.search) {
      url = `${API_BASE}/movies/search?title=${encodeURIComponent(params.search)}`;
    } else if (params.filter) {
      url = `${API_BASE}/movies/filter?` +
        `genre=${encodeURIComponent(params.filter.genre || '')}` +
        `&min_rating=${params.filter.minRating || ''}` +
        `&min_year=${params.filter.minYear || ''}` +
        `&sort_by=${params.filter.sortBy || ''}` +
        `&order=${params.filter.order || 'desc'}`;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('No movies found');
      const data = await res.json();
      setMovies(data);
    } catch (err) {
      setMovies([]);
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      fetchMovies({ search });
    } else {
      fetchMovies();
    }
  };

  const handleFilter = () => {
    fetchMovies({
      filter: {
        genre,
        minRating,
        minYear,
        sortBy,
        order,
      },
    });
  };

  const handleExport = () => {
    window.open(`${API_BASE}/export/csv`, '_blank');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Movie Explorer
      </Typography>
      <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <TextField
          label="Search by Title"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton type="submit">
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />
        <TextField
          label="Genre"
          value={genre}
          onChange={e => setGenre(e.target.value)}
          sx={{ minWidth: 120 }}
        />
        <TextField
          label="Min IMDb Rating"
          type="number"
          inputProps={{ min: 0, max: 10, step: 0.1 }}
          value={minRating}
          onChange={e => setMinRating(e.target.value)}
          sx={{ minWidth: 120 }}
        />
        <TextField
          label="Min Year"
          type="number"
          inputProps={{ min: 1800, max: 2100 }}
          value={minYear}
          onChange={e => setMinYear(e.target.value)}
          sx={{ minWidth: 120 }}
        />
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={e => setSortBy(e.target.value)}
          >
            {sortOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 100 }}>
          <InputLabel>Order</InputLabel>
          <Select
            value={order}
            label="Order"
            onChange={e => setOrder(e.target.value)}
          >
            <MenuItem value="desc">Desc</MenuItem>
            <MenuItem value="asc">Asc</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleFilter} sx={{ minWidth: 120 }}>
          Filter
        </Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} sx={{ minWidth: 120 }}>
          Export CSV
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center">{error}</Typography>
      ) : (
        <Grid container spacing={2}>
          {movies.map(movie => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {movie.poster_url && movie.poster_url !== 'N/A' && (
                  <CardMedia
                    component="img"
                    height="350"
                    image={movie.poster_url}
                    alt={movie.title}
                  />
                )}
                <CardContent>
                  <Typography variant="h6">{movie.title} ({movie.year})</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Director: {movie.director || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Genres: {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Runtime: {movie.runtime_minutes ? `${movie.runtime_minutes} min` : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    IMDb: {movie.imdb_rating ?? 'N/A'} | Tomatometer: {movie.tomatometer_score ?? 'N/A'} | Audience: {movie.audience_score ?? 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {movie.plot_summary}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <b>Cast:</b> {Array.isArray(movie.cast) ? movie.cast.map(c => `${c.actor} (${c.character})`).join(', ') : ''}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <a href={movie.source_imdb_url} target="_blank" rel="noopener noreferrer">IMDb</a>
                    {movie.rotten_tomatoes_url && movie.rotten_tomatoes_url !== 'N/A' && (
                      <>
                        {' | '}
                        <a href={movie.rotten_tomatoes_url} target="_blank" rel="noopener noreferrer">Rotten Tomatoes</a>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
