// src/components/Charts.jsx

import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

// (The data processing functions at the top of the file do not need to change)
const processScatterData = (movies) => {
  if (!movies) return [];
  return movies
    .filter(movie => movie.imdb_rating && movie.tomatometer_score)
    .map(movie => ({
      name: movie.title,
      imdb: movie.imdb_rating,
      rt: movie.tomatometer_score,
    }));
};

const processHistogramData = (movies) => {
    if (!movies) return [];
    const ratings = movies.map(m => m.imdb_rating).filter(r => r);
    const bins = [
        { name: '7-7.4', count: 0 }, { name: '7.5-7.9', count: 0 },
        { name: '8-8.4', count: 0 }, { name: '8.5-8.9', count: 0 },
        { name: '9-10', count: 0 },
    ];
    ratings.forEach(rating => {
        if (rating >= 7 && rating < 7.5) bins[0].count++;
        else if (rating >= 7.5 && rating < 8) bins[1].count++;
        else if (rating >= 8 && rating < 8.5) bins[2].count++;
        else if (rating >= 8.5 && rating < 9) bins[3].count++;
        else if (rating >= 9 && rating <= 10) bins[4].count++;
    });
    return bins;
};


// --- The Main Chart Component ---
function Charts({ movies }) {
  // Return early if there are no movies to prevent errors
  if (!movies || movies.length === 0) {
    return null;
  }

  const scatterData = processScatterData(movies);
  const histogramData = processHistogramData(movies);

  // The ultimate NaN fix: Don't render charts until the processed data is ready.
  const canRenderCharts = scatterData.length > 0 && histogramData.length > 0;

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
        Data Insights
      </Typography>
      
      {!canRenderCharts ? (
         <Typography>Not enough data to display charts.</Typography>
      ) : (
        <Grid container spacing={5}> {/* Increased spacing between charts */}
            
            {/* --- CHART 1 (NOW FULL WIDTH) --- */}
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom align="center">IMDb Rating Distribution</Typography>
                {/* --- INCREASED HEIGHT AND ADDED MIN-HEIGHT TO PARENT --- */}
                <Box sx={{ width: 600, height: 500 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        
                        <BarChart data={histogramData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip cursor={{fill: '#444'}} />
                            <Bar dataKey="count" fill="#82ca9d" name="Number of Movies" />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Grid>

            {/* --- CHART 2 (NOW FULL WIDTH) --- */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom align="center">IMDb Rating vs. Tomatometer Score</Typography>
              {/* --- INCREASED HEIGHT AND ADDED MIN-HEIGHT TO PARENT --- */}
               <Box sx={{ width: 600, height: 500 }}>
                    <ResponsiveContainer width="110%" height="110%">
                        <ScatterChart margin={{ top: 0, right: 0, bottom: 22, left: 100 }}>
                          <CartesianGrid />
                          <XAxis type="number" dataKey="imdb" name="IMDb Rating" unit="" domain={[7, 10]} />
                          <YAxis type="number" dataKey="rt" name="Tomatometer" unit="%" domain={[50, 100]} />
                          <ZAxis dataKey="name" name="title"/>
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Legend />
                          <Scatter name="Movies" data={scatterData} fill="#ff7300" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </Box>
            </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default Charts;