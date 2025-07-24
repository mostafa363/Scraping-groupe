// src/components/HeroSection.jsx

import React from 'react';
import { Box, Typography, Button, Fade } from '@mui/material';

function HeroSection({ movie, onClick  }) {
  // If there's no movie to display, render nothing.
  if (!movie) {
    return null;
  }

  return (
    // Fade in the whole component for a smooth effect
    <Fade in={true} timeout={1000}>
      <Box
        sx={{
          position: 'relative',
          height: '60vh', // 60% of the viewport height
          width: '100%',
          mb: 4,
          borderRadius: 2,
          overflow: 'hidden',
          // Set the background image
          backgroundImage: `url(${movie.poster_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          // Add a dark overlay so text is readable
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: 4,
          }}
        >
          <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
            {movie.title}
          </Typography>
          <Typography variant="h6" component="p" sx={{ maxWidth: '60%', mb: 2 }}>
            {movie.plot_summary}
          </Typography>
          <Button onClick={onClick} variant="contained" color="primary" size="large">
            More Info
          </Button>
        </Box>
      </Box>
    </Fade>
  );
}

export default HeroSection;