// src/components/HeroSection.jsx
 
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Fade, Chip, Rating, IconButton, Tooltip } from '@mui/material';
import { PlayArrow, Add, ThumbUp, Info, VolumeOff, VolumeUp } from '@mui/icons-material';
 
function HeroSection({ movie, onClick }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
 
  // If there's no movie to display, render nothing.
  if (!movie) {
    return null;
  }
 
  // Preload the background image
  useEffect(() => {
    if (movie.poster_url) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = movie.poster_url;
    }
  }, [movie.poster_url]);
 
  // Format runtime
  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
 
  // Format rating
  const formatRating = (rating) => {
    return rating ? parseFloat(rating).toFixed(1) : 'N/A';
  };
 
  return (
    <Fade in={imageLoaded} timeout={1500}>
      <Box
        sx={{
          position: 'relative',
          height: { xs: '70vh', md: '85vh' },
          width: '100%',
          mb: 0,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.02)',
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        {/* Background Image with Parallax Effect */}
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            right: '-10%',
            bottom: '-10%',
            backgroundImage: `url(${movie.poster_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            filter: isHovered ? 'brightness(1.1) contrast(1.1)' : 'brightness(0.9)',
            transition: 'all 0.8s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
 
        {/* Multiple Gradient Overlays for Cinematic Effect */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              linear-gradient(
                45deg,
                rgba(13, 17, 23, 0.9) 0%,
                rgba(13, 17, 23, 0.7) 25%,
                rgba(196, 30, 58, 0.2) 50%,
                rgba(245, 200, 66, 0.1) 75%,
                rgba(13, 17, 23, 0.8) 100%
              ),
              linear-gradient(
                180deg,
                transparent 0%,
                rgba(13, 17, 23, 0.3) 60%,
                rgba(13, 17, 23, 0.9) 100%
              )
            `,
            zIndex: 1,
          }}
        />
 
        {/* Animated Light Rays */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            right: '10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(245, 200, 66, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite',
            zIndex: 1,
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)' },
              '50%': { transform: 'translateY(-20px) scale(1.1)' },
            },
          }}
        />
 
        {/* Top Controls Bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 3,
            p: 3,
            display: 'flex',
            gap: 1,
          }}
        >
          
        </Box>
 
        {/* Main Content */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: { xs: 3, md: 6 },
            maxWidth: { xs: '100%', md: '60%' },
          }}
        >
          {/* Movie Title with Cinematic Typography */}
          <Fade in={true} timeout={2000}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
                background: 'linear-gradient(45deg, #F5C842 30%, #FFD700 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                mb: 2,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                animation: 'glow 3s ease-in-out infinite alternate',
                '@keyframes glow': {
                  from: { filter: 'drop-shadow(0 0 5px rgba(245, 200, 66, 0.5))' },
                  to: { filter: 'drop-shadow(0 0 20px rgba(245, 200, 66, 0.8))' },
                },
              }}
            >
              {movie.title}
            </Typography>
          </Fade>
 
          {/* Movie Metadata */}
          <Fade in={true} timeout={2500}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
              {/* Year */}
              <Chip
                label={movie.year || 'N/A'}
                sx={{
                  backgroundColor: 'rgba(245, 200, 66, 0.2)',
                  color: '#F5C842',
                  border: '1px solid rgba(245, 200, 66, 0.5)',
                  fontWeight: 'bold',
                }}
              />
             
              {/* Runtime */}
              <Chip
                label={formatRuntime(movie.runtime)}
                sx={{
                  backgroundColor: 'rgba(196, 30, 58, 0.2)',
                  color: '#C41E3A',
                  border: '1px solid rgba(196, 30, 58, 0.5)',
                  fontWeight: 'bold',
                }}
              />
 
              {/* Genre */}
              {movie.genre && (
                <Chip
                  label={movie.genre}
                  sx={{
                    backgroundColor: 'rgba(248, 249, 250, 0.1)',
                    color: '#F8F9FA',
                    border: '1px solid rgba(248, 249, 250, 0.3)',
                    fontWeight: 'bold',
                  }}
                />
              )}
            </Box>
          </Fade>
 
          {/* Ratings */}
          <Fade in={true} timeout={3000}>
            <Box sx={{ display: 'flex', gap: 4, mb: 3, alignItems: 'center' }}>
              {/* IMDB Rating */}
              {movie.imdb_rating && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#F8F9FA', opacity: 0.8 }}>
                    IMDB
                  </Typography>
                  <Rating
                    value={parseFloat(movie.imdb_rating) / 2}
                    readOnly
                    precision={0.1}
                    sx={{
                      '& .MuiRating-iconFilled': { color: '#F5C842' },
                      '& .MuiRating-iconEmpty': { color: 'rgba(245, 200, 66, 0.3)' },
                    }}
                  />
                  <Typography variant="h6" sx={{ color: '#F5C842', fontWeight: 'bold' }}>
                    {formatRating(movie.imdb_rating)}
                  </Typography>
                </Box>
              )}
 
              {/* Rotten Tomatoes */}
              {movie.rotten_tomatoes_rating && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#F8F9FA', opacity: 0.8 }}>
                    🍅
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#C41E3A', fontWeight: 'bold' }}>
                    {movie.rotten_tomatoes_rating}%
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
 
          {/* Plot Summary */}
          <Fade in={true} timeout={3500}>
            <Typography
              variant="h6"
              component="p"
              sx={{
                maxWidth: { xs: '100%', md: '80%' },
                mb: 4,
                color: '#F8F9FA',
                lineHeight: 1.6,
                fontSize: { xs: '1rem', md: '1.25rem' },
                fontWeight: 400,
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {movie.plot_summary || "Discover the story behind this cinematic masterpiece..."}
            </Typography>
          </Fade>
 
          {/* Action Buttons */}
          <Fade in={true} timeout={4000}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* Play Button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                sx={{
                  background: 'linear-gradient(45deg, #F5C842 30%, #FFD700 90%)',
                  color: '#0D1117',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  boxShadow: '0 4px 20px rgba(245, 200, 66, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FFD700 30%, #F5C842 90%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 25px rgba(245, 200, 66, 0.6)',
                  }
                }}
              >
                More Details
              </Button>
 
             
 
             
            </Box>
          </Fade>
        </Box>
 
        {/* Bottom Fade Effect */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(to top, rgba(13, 17, 23, 1) 0%, transparent 100%)',
            zIndex: 2,
          }}
        />
      </Box>
    </Fade>
  );
}
 
export default HeroSection;