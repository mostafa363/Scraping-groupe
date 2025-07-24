// src/components/RatingComparison.jsx

import React from 'react';
import { Box, Typography } from '@mui/material';

// This function converts an IMDb rating (e.g., 8.5) to a percentage.
const normalizeImdb = (rating) => {
  if (rating === null || rating === undefined) return 0;
  return Math.round(rating * 10);
};

function RatingComparison({ imdb, rt, audience }) {
  const imdbNormalized = normalizeImdb(imdb);

  return (
    <Box sx={{ width: '100%' }}>
      {/* --- Score Texts --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          IMDb: {imdb || 'N/A'}
        </Typography>
        <Typography variant="caption" color="#61C14F" sx={{ fontWeight: 'bold' }}>
          RT: {rt ? `${rt}%` : 'N/A'}
        </Typography>
        <Typography variant="caption" color="#E5B843" sx={{ fontWeight: 'bold' }}>
          Audience: {audience ? `${audience}%` : 'N/A'}
        </Typography>
      </Box>

      {/* --- Visual Bar --- */}
      <Box sx={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', bgcolor: '#424242' }}>
        {/* IMDb Bar Segment */}
        <Box sx={{ width: `${imdbNormalized}%`, bgcolor: 'primary.main' }} />
        {/* Rotten Tomatoes Bar Segment */}
        <Box sx={{ width: `${rt || 0}%`, bgcolor: '#61C14F', ml: '-1px' }} /> 
         {/* The negative margin helps overlap the bars slightly to avoid gaps */}
      </Box>
    </Box>
  );
}

export default RatingComparison;