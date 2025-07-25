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
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 520, width: '100%' }}>
      <Card 
        onClick={onClick}
        sx={{ 
          width: 340,
          minHeight: 500,
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'background.paper',
          color: 'text.primary',
          cursor: 'pointer',
          borderRadius: 4,
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)',
          overflow: 'hidden',
          mx: 'auto',
          p: 0,
          transition: 'transform 0.25s, box-shadow 0.25s',
          '&:hover': {
            transform: 'scale(1.04)',
            boxShadow: '0 12px 32px 0 rgba(0,0,0,0.22)'
          }
        }}
      >
        <CardMedia
          component="img"
          image={movie.poster_url || placeholderImage}
          alt={`Poster for ${movie.title}`}
          sx={{ height: 420, objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
          onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
        />
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', px: 2, py: 2 }}>
          <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
            {movie.title || 'No Title'} <span style={{ color: '#aaa', fontWeight: 400 }}>({movie.year || 'N/A'})</span>
          </Typography>
          {/* Genres removed from card, will be shown in MovieDetailModal only */}
          {/* 2. Replace the old rating texts with the new component */}
          <Box sx={{ mt: 'auto', width: '100%' }}>
            <RatingComparison 
              imdb={movie.imdb_rating} 
              rt={movie.tomatometer_score}
              audience={movie.audience_score}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default MovieCard;