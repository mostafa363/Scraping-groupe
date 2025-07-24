# backend/app.py

import subprocess
import sys
import csv
import io
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.responses import StreamingResponse

# Import the database connection and the now-updated helper function
from .database import collection, movie_helper

from fastapi.middleware.cors import CORSMiddleware

# Initialize the FastAPI app
app = FastAPI(
    title="Movie Scraper API",
    description="An API to access enriched movie data from IMDb and Rotten Tomatoes."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# API ENDPOINTS TO GET MOVIES (Largely unchanged, rely on the helper)
# =====================================================================
@app.get("/movies", summary="Get a list of all movies")
async def get_movies(skip: int = 0, limit: int = 25):
    movies = []
    # No changes needed here, as the logic relies on the updated movie_helper
    async for movie in collection.find().skip(skip).limit(limit):
        movies.append(movie_helper(movie))
    return movies


@app.get("/movies/search", summary="Search for movies by title")
async def search_movies(title: str):
    movies = []
    query = {"title": {"$regex": title, "$options": "i"}}
    # No changes needed here either
    async for movie in collection.find(query):
        movies.append(movie_helper(movie))
    if not movies:
        raise HTTPException(status_code=404, detail=f"No movies found with title containing '{title}'")
    return movies


# =====================================================================
# UPDATED FILTER ENDPOINT
# =====================================================================
@app.get("/movies/filter", summary="Filter and sort movies with detailed criteria")
async def filter_movies(
    genre: Optional[str] = None,
    # UPDATED: The query parameter is still 'min_rating' for user convenience,
    # but the logic now queries the 'imdb_rating' field.
    min_rating: Optional[float] = Query(None, ge=0, le=10, description="Filter by minimum IMDb rating"),
    min_year: Optional[int] = Query(None, ge=1800),
    # UPDATED: The enum now reflects the new data structure.
    sort_by: Optional[str] = Query(None, enum=["imdb_rating", "tomatometer_score", "year", "runtime_minutes"]),
    order: str = Query("desc", enum=["asc", "desc"])
):
    query = {}
    if genre:
        query["genres"] = {"$regex": genre, "$options": "i"}
    if min_rating is not None:
        # THE FIX IS HERE: Query the correct 'imdb_rating' field in the database.
        query["imdb_rating"] = {"$gte": min_rating}
    if min_year is not None:
        query["year"] = {"$gte": min_year}

    movies = []
    
    sort_direction = 1 if order == "asc" else -1
    sort_criteria = []
    if sort_by:
        sort_criteria.append((sort_by, sort_direction))
    else:
        # THE FIX IS HERE: Default sort should also use 'imdb_rating'.
        sort_criteria.append(("imdb_rating", -1))

    cursor = collection.find(query)
    if sort_criteria:
        cursor = cursor.sort(sort_criteria)
        
    async for movie in cursor:
        movies.append(movie_helper(movie))
        
    if not movies:
        raise HTTPException(status_code=404, detail="No movies found matching your criteria.")
        
    return movies


# =====================================================================
# UPDATED CSV EXPORT ENDPOINT
# =====================================================================
@app.get("/export/csv", summary="Export all movie data to a CSV file")
async def export_to_csv():
    stream = io.StringIO()
    writer = csv.writer(stream, delimiter=';')

    # THE FIX IS HERE: Update headers to match the new data structure.
    headers = [
        "id", "title", "year", 
        "imdb_rating", "tomatometer_score", "audience_score", 
        "director", "plot_summary", "genres", "runtime_minutes", "cast", 
        "source_imdb_url", "rotten_tomatoes_url"
    ]
    writer.writerow(headers)

    movies_cursor = collection.find()
    async for movie in movies_cursor:
        genres_str = ", ".join(movie.get("genres", []))
        cast_str = " | ".join([c.get("actor", "") for c in movie.get("cast", [])])

        # THE FIX IS HERE: Write the row with the correct new fields.
        writer.writerow([
            str(movie["_id"]),
            movie.get("title"),
            movie.get("year"),
            movie.get("imdb_rating"),
            movie.get("tomatometer_score"),
            movie.get("audience_score"),
            movie.get("director"),
            movie.get("plot_summary"),
            genres_str,
            movie.get("runtime_minutes"),
            cast_str,
            movie.get("source_imdb_url"),
            movie.get("rotten_tomatoes_url"),
        ])
    
    stream.seek(0)
    
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=movies.csv"}
    )


# =====================================================================
# SCRAPER ENDPOINT (No changes needed here)
# =====================================================================
def run_scraper_script():
    print("--- Background Task: Starting scraper script ---")
    try:
        subprocess.run([sys.executable, "scraper/scraper.py"], check=True)
        print("--- Background Task: Scraper script finished successfully ---")
    except subprocess.CalledProcessError as e:
        print(f"--- Background Task: Scraper script failed with error: {e} ---")
    except FileNotFoundError:
        print("--- Background Task: Error - 'scraper/scraper.py' not found. ---")


@app.post("/scraper/run", status_code=202, summary="Start a new scraping process")
async def run_scraper(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_scraper_script)
    return {"message": "Scraping process started in the background. It will take several minutes to complete."}