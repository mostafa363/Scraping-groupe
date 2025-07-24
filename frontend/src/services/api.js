// src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000', // The address of your FastAPI backend
  headers: {
    'Content-Type': 'application/json'
  }
});

// Function to get a list of movies with filters
export const getMovies = (params) => {
  return apiClient.get('/movies/filter', { params });
};

// Function to search for movies by title
export const searchMovies = (title) => {
  return apiClient.get('/movies/search', { params: { title } });
};