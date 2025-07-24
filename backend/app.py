# backend/app.py

import subprocess
import sys
import csv
import io
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.responses import StreamingResponse

from .database import collection, movie_helper
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Movie Scraper API",
    description="An API to access enriched movie data from IMDb and Rotten Tomatoes."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# API ENDPOINTS TO GET MOVIES
# =====================================================================
@app.get("/movies", summary="Get a list of all movies")
async def get_movies(skip: int = 0, limit: int = 25):
    movies = []
    async for movie in collection.find().skip(skip).limit(limit):
        movies.append(movie_helper(movie))
    return movies


@app.get("/movies/search", summary="Search for movies by title")
async def search_movies(title: str):
    movies = []
    query = {"title": {"$regex": title, "$options": "i"}}
    async for movie in collection.find(query):
        movies.append(movie_helper(movie))
    if not movies:
        raise HTTPException(status_code=404, detail=f"No movies found with title containing '{title}'")
    return movies


# =====================================================================
# UPDATED FILTER ENDPOINT WITH DISCREPANCY SORT
# =====================================================================
@app.get("/movies/filter", summary="Filter and sort movies with detailed criteria")
async def filter_movies(
    min_rating: Optional[float] = Query(None, ge=0, le=10, description="Filter by minimum IMDb rating"),
    min_year: Optional[int] = Query(None, ge=1800),
    # UPDATED: Added 'discrepancy' to the list of allowed values
    sort_by: Optional[str] = Query(None, enum=["imdb_rating", "tomatometer_score", "year", "runtime_minutes", "discrepancy"]),
    order: str = Query("desc", enum=["asc", "desc"])
):
    query = {}
    if min_rating is not None:
        query["imdb_rating"] = {"$gte": min_rating}
    if min_year is not None:
        query["year"] = {"$gte": min_year}
    
    # --- NEW LOGIC FOR DISCREPANCY SORT ---
    # If the user wants to sort by discrepancy, we must use a MongoDB Aggregation Pipeline.
    if sort_by == 'discrepancy':
        pipeline = [
            # Stage 1: Match documents based on the initial query (e.g., min_year)
            {'$match': query},
            # Stage 2: Add new fields to each document without removing existing ones
            {'$addFields': {
                # Create a field that normalizes IMDb's 1-10 score to a 1-100 scale
                'normalized_imdb': {'$multiply': ['$imdb_rating', 10]},
            }},
            {'$addFields': {
                # Create the 'discrepancy' field by calculating the absolute difference
                'discrepancy': {
                    '$abs': {'$subtract': ['$normalized_imdb', '$tomatometer_score']}
                }
            }},
            # Stage 3: Sort the documents by the new 'discrepancy' field
            {'$sort': {'discrepancy': -1 if order == 'desc' else 1}}
        ]
        
        movies = []
        async for movie in collection.aggregate(pipeline):
            movies.append(movie_helper(movie))
        return movies

    # --- REGULAR SORTING LOGIC (for all other sort_by options) ---
    else:
        movies = []
        sort_direction = 1 if order == "asc" else -1
        sort_criteria = []
        if sort_by:
            sort_criteria.append((sort_by, sort_direction))
        else:
            sort_criteria.append(("imdb_rating", -1)) # Default sort

        cursor = collection.find(query).sort(sort_criteria)
        async for movie in cursor:
            movies.append(movie_helper(movie))
            
        if not movies:
            raise HTTPException(status_code=404, detail="No movies found matching your criteria.")
            
        return movies


# =====================================================================
# CSV EXPORT ENDPOINT (No changes needed)
# =====================================================================
@app.get("/export/csv", summary="Export all movie data to a CSV file")
async def export_to_csv():
    stream = io.StringIO()
    writer = csv.writer(stream, delimiter=';')
    headers = ["id", "title", "year", "imdb_rating", "tomatometer_score", "audience_score", "director", "plot_summary", "genres", "runtime_minutes", "cast", "source_imdb_url", "rotten_tomatoes_url"]
    writer.writerow(headers)
    movies_cursor = collection.find()
    async for movie in movies_cursor:
        genres_str = ", ".join(movie.get("genres", []))
        cast_str = " | ".join([c.get("actor", "") for c in movie.get("cast", [])])
        writer.writerow([
            str(movie["_id"]), movie.get("title"), movie.get("year"), movie.get("imdb_rating"),
            movie.get("tomatometer_score"), movie.get("audience_score"), movie.get("director"),
            movie.get("plot_summary"), genres_str, movie.get("runtime_minutes"), cast_str,
            movie.get("source_imdb_url"), movie.get("rotten_tomatoes_url"),
        ])
    stream.seek(0)
    return StreamingResponse(iter([stream.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=movies.csv"})


# =====================================================================
# SCRAPER ENDPOINT (No changes needed)
# =====================================================================
def run_scraper_script():
    print("--- Background Task: Starting scraper script ---")
    try:
        subprocess.run([sys.executable, "scraper/scraper.py"], check=True)
        print("--- Background Task: Scraper script finished successfully ---")
    except Exception as e:
        print(f"--- Background Task: Scraper script failed: {e} ---")

@app.post("/scraper/run", status_code=202, summary="Start a new scraping process")
async def run_scraper(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_scraper_script)
    return {"message": "Scraping process started in the background. It will take several minutes to complete."}