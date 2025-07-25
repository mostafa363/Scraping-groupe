// src/components/MovieDetailModal.jsx
 
import React from 'react';
import {
  Modal, Box, Typography, List, ListItem, ListItemText, Chip, Divider, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
 
// Style for the modal box
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 800,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto'
};
 
function MovieDetailModal({ movie, open, handleClose }) {
  if (!movie) {
    return null;
  }
 
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="movie-detail-modal-title"
    >
      <Box sx={style}>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
 
        <Typography id="movie-detail-modal-title" variant="h4" component="h2" gutterBottom>
          {movie.title} ({movie.year})
        </Typography>
       
        <Typography variant="body1" sx={{ mb: 2 }}>
          {movie.plot_summary}
        </Typography>
 
        <Divider sx={{ my: 2 }} />
 
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {movie.genres.map(genre => <Chip key={genre} label={genre} />)}
        </Box>
       
        <List dense>
            <ListItem>
                <ListItemText primary="Director" secondary={movie.director} />
            </ListItem>
            <ListItem>
                <ListItemText primary="Runtime" secondary={`${movie.runtime_minutes} minutes`} />
            </ListItem>
            <ListItem>
                <ListItemText primary="IMDb Rating" secondary={movie.imdb_rating} />
            </ListItem>
            <ListItem>
                <ListItemText primary="Tomatometer" secondary={movie.tomatometer_score ? `${movie.tomatometer_score}%` : 'N/A'} />
            </ListItem>
             <ListItem>
                <ListItemText primary="Audience Score" secondary={movie.audience_score ? `${movie.audience_score}%` : 'N/A'} />
            </ListItem>
        </List>
       
        <Divider sx={{ my: 2 }}>Cast</Divider>
       
        <List dense>
            {movie.cast.map((member, index) => (
                <ListItem key={index}>
                    <ListItemText primary={member.actor} secondary={member.character} />
                </ListItem>
            ))}
        </List>
      </Box>
    </Modal>
  );
}
 
export default MovieDetailModal;