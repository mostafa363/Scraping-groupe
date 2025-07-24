// src/components/Navbar.jsx

import React from 'react';
import { AppBar, Toolbar, Grid, TextField, MenuItem, FormControl, InputLabel, Select, Typography } from '@mui/material';

const sortOptions = [
  { value: 'imdb_rating', label: 'IMDb Rating' },
  { value: 'tomatometer_score', label: 'Tomatometer Score' },
  { value: 'year', label: 'Release Year' },
  { value: 'runtime_minutes', label: 'Runtime' },
  { value: 'discrepancy', label: 'Rating Discrepancy' },
];

function Navbar({ filters, setFilters }) {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  return (
    // Use AppBar for a persistent header. position="static" keeps it in the normal document flow.
    <AppBar position="static" color="default" sx={{ bgcolor: 'background.paper', mb: 4 }}>
      <Toolbar>
        <Grid container spacing={2} alignItems="center">
          
          <Grid item xs={12} sm={3}>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Filter & Sort
            </Typography>
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField fullWidth name="title" value={filters.title || ''} onChange={handleInputChange} label="Search by Title" variant="outlined" size="small"/>
          </Grid>
          
          <Grid item xs={6} sm={2}>
            <TextField fullWidth name="min_year" value={filters.min_year || ''} onChange={handleInputChange} label="Min Year" type="number" size="small"/>
          </Grid>

          <Grid item xs={6} sm={2}>
            <TextField fullWidth name="min_rating" value={filters.min_rating || ''} onChange={handleInputChange} label="Min IMDb Rating" type="number" size="small"/>
          </Grid>

          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select name="sort_by" value={filters.sort_by || 'imdb_rating'} onChange={handleInputChange} label="Sort By">
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Order</InputLabel>
              <Select name="order" value={filters.order || 'desc'} onChange={handleInputChange} label="Order">
                <MenuItem value="desc">Desc</MenuItem>
                <MenuItem value="asc">Asc</MenuItem>
              </Select>
            </FormControl>
          </Grid>

        </Grid>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;