// src/components/MovieCard.jsx

import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Chip } from '@mui/material';
import RatingComparison from './RatingComparison'; // 1. Import the new component

const placeholderImage = 'https://via.placeholder.com/300x450.png?text=No+Image';

function MovieCard({ movie, onClick }) {
  if (!movie) {
    return null;
  }

  return (
    <Card 
      onClick={onClick}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: '#2c2c2c',
        color: 'text.primary',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'scale(1.03)',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardMedia
        component="img"
        image={movie.poster_url || placeholderImage}
        alt={`Poster for ${movie.title}`}
        sx={{ height: '400px', objectFit: 'cover' }}
        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography gutterBottom variant="h6" component="h2" noWrap sx={{ flexGrow: 1 }}>
          {movie.title || 'No Title'} ({movie.year || 'N/A'})
        </Typography>
        
        {/* 2. Replace the old rating texts with the new component */}
        <Box sx={{ mt: 'auto' }}>
           <RatingComparison 
              imdb={movie.imdb_rating} 
              rt={movie.tomatometer_score}
              audience={movie.audience_score}
            />
        </Box>
      </CardContent>
    </Card>
  );
}

export default MovieCard;