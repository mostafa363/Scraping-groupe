// src/components/SummaryStats.jsx

import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';

// Helper function to calculate stats
const calculateStats = (movies) => {
  if (!movies || movies.length === 0) {
    return { total: 0, avgImdb: 0, avgRt: 0 };
  }

  const imdbRatings = movies.map(m => m.imdb_rating).filter(r => r !== null && r !== undefined);
  const rtScores = movies.map(m => m.tomatometer_score).filter(s => s !== null && s !== undefined);

  const avgImdb = imdbRatings.reduce((a, b) => a + b, 0) / imdbRatings.length;
  const avgRt = rtScores.reduce((a, b) => a + b, 0) / rtScores.length;

  return {
    total: movies.length,
    avgImdb: avgImdb.toFixed(2), // Format to 2 decimal places
    avgRt: Math.round(avgRt),    // Round to nearest whole number
  };
};

// A single card for displaying one statistic
function StatCard({ title, value }) {
  return (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
      <Typography variant="h6" color="text.secondary">{title}</Typography>
      <Typography variant="h4" fontWeight="bold">{value}</Typography>
    </Paper>
  );
}

function SummaryStats({ movies }) {
  const stats = calculateStats(movies);

  return (
    <Box sx={{ my: 4 }}>
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} sm={4}>
          <StatCard title="Total Movies" value={stats.total} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Avg. IMDb Rating" value={stats.avgImdb} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Avg. Tomatometer" value={`${stats.avgRt}%`} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default SummaryStats;