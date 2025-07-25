// src/components/Navbar.jsx

import React, { useState, useEffect } from 'react';
// --- MERGED IMPORTS ---
// Added Button and DownloadIcon for the export feature
import { AppBar, Toolbar, Box, Grid, TextField, MenuItem, FormControl, InputLabel, Select, Typography, Button } from '@mui/material';
import TheatersIcon from '@mui/icons-material/Theaters';
import DownloadIcon from '@mui/icons-material/Download';

const sortOptions = [
  { value: 'imdb_rating', label: 'IMDb Rating' },
  { value: 'tomatometer_score', label: 'Tomatometer' },
  { value: 'year', label: 'Release Year' },
  { value: 'runtime_minutes', label: 'Runtime' },
  { value: 'discrepancy', label: 'Rating Discrepancy' },
];

// --- STEP 1: ADD `movies` TO PROPS ---
// The component now needs the movies data to export it.
function Navbar({ filters, setFilters, movies }) {

  // --- Debouncing logic from the first component (no changes needed here) ---
  const [localFilters, setLocalFilters] = useState({
    title: filters.title || '',
    min_year: filters.min_year || '',
    min_rating: filters.min_rating || ''
  });

  const handleLocalChange = (event) => {
    const { name, value } = event.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prevFilters => ({
        ...prevFilters,
        title: localFilters.title,
        min_year: localFilters.min_year,
        min_rating: localFilters.min_rating,
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [localFilters, setFilters]);

  const handleSelectChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // --- STEP 2: PASTE THE CSV EXPORT FUNCTION ---
  // This is the exact function from your second Navbar.
  const handleExportCSV = () => {
    if (!movies || movies.length === 0) return;
    const headers = [
      "id", "title", "year", "imdb_rating", "tomatometer_score", "audience_score", "director", "plot_summary", "genres", "runtime_minutes", "cast", "source_imdb_url", "rotten_tomatoes_url"
    ];
    const csvRows = [headers.join(",")];
    movies.forEach(movie => {
      const row = [
        movie.id,
        '"' + (movie.title || '').replace(/"/g, '""') + '"',
        movie.year,
        movie.imdb_rating,
        movie.tomatometer_score,
        movie.audience_score,
        '"' + (movie.director || '').replace(/"/g, '""') + '"',
        '"' + (movie.plot_summary || '').replace(/"/g, '""') + '"',
        '"' + (Array.isArray(movie.genres) ? movie.genres.join('; ') : '') + '"',
        movie.runtime_minutes,
        '"' + (Array.isArray(movie.cast) ? movie.cast.map(c => `${c.actor} (${c.character})`).join('; ') : '') + '"',
        movie.source_imdb_url,
        movie.rotten_tomatoes_url
      ];
      csvRows.push(row.map(v => v === undefined ? '' : v).join(","));
    });
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'movies.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'background.paper' }}>
      <Toolbar>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          
          {/* Section Marque/Titre (Unchanged) */}
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TheatersIcon color="primary" sx={{ fontSize: '2rem' }} />
              <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'block' } }}>
                MovieScrape
              </Typography>
            </Box>
          </Grid>
          
          {/* Section des Filtres */}
          <Grid item xs>
            <Grid container spacing={2} alignItems="center" justifyContent="flex-end">
              <Grid item xs={12} sm={4} md={3}>
                <TextField fullWidth name="title" value={localFilters.title} onChange={handleLocalChange} label="Search by Title" variant="outlined" size="small" />
              </Grid>
              
              <Grid item xs={6} sm={2} md="auto">
                <TextField fullWidth name="min_year" value={localFilters.min_year} onChange={handleLocalChange} label="Min Year" type="number" size="small" />
              </Grid>

              <Grid item xs={6} sm={2} md="auto">
                <TextField fullWidth name="min_rating" value={localFilters.min_rating} onChange={handleLocalChange} label="Min IMDb" type="number" size="small" />
              </Grid>

              <Grid item xs={12} sm={4} md={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select name="sort_by" value={filters.sort_by || 'imdb_rating'} onChange={handleSelectChange} label="Sort By">
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2} md="auto">
                <FormControl fullWidth size="small">
                  <InputLabel>Order</InputLabel>
                  <Select name="order" value={filters.order || 'desc'} onChange={handleSelectChange} label="Order">
                    <MenuItem value="desc">Desc</MenuItem>
                    <MenuItem value="asc">Asc</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* --- STEP 3: ADD THE EXPORT BUTTON --- */}
              {/* Placed as the last item in the filters section for a clean layout. */}
              <Grid item xs={12} sm="auto">
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportCSV}
                  // It's good practice to disable the button if there are no movies
                  disabled={!movies || movies.length === 0}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Export CSV
                </Button>
              </Grid>

            </Grid>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;