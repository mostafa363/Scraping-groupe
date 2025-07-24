# backend/app.py

import subprocess
import sys
import csv
import io
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.responses import StreamingResponse

# Import the database connection and helper function from our database.py
from database import collection, movie_helper

# Initialize the FastAPI app
app = FastAPI(
    title="Movie Scraper API",
    description="An API to access movie data collected from IMDb."
)

# =====================================================================
# API ENDPOINTS TO GET MOVIES
# =====================================================================
@app.get("/movies", summary="Get a list of all movies")
async def get_movies(skip: int = 0, limit: int = 25):
    """
    Retrieve a paginated list of movies from the database.
    - **skip**: Number of records to skip for pagination.
    - **limit**: Maximum number of records to return.
    """
    movies = []
    async for movie in collection.find().skip(skip).limit(limit):
        movies.append(movie_helper(movie))
    return movies


@app.get("/movies/search", summary="Search for movies by title")
async def search_movies(title: str):
    """
    Search for movies that contain the given text in their title.
    The search is case-insensitive.
    """
    movies = []
    query = {"title": {"$regex": title, "$options": "i"}}
    async for movie in collection.find(query):
        movies.append(movie_helper(movie))
    if not movies:
        raise HTTPException(status_code=404, detail=f"No movies found with title containing '{title}'")
    return movies


@app.get("/movies/filter", summary="Filter and sort movies with detailed criteria")
async def filter_movies(
    genre: Optional[str] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=10),
    min_year: Optional[int] = Query(None, ge=1800),
    sort_by: Optional[str] = Query(None, enum=["rating", "year", "runtime_minutes"]),
    order: str = Query("desc", enum=["asc", "desc"])
):
    """
    Find movies by filtering on genre, minimum rating, and minimum year.
    You can also sort the results by rating, year, or runtime.
    """
    query = {}
    if genre:
        query["genres"] = {"$regex": genre, "$options": "i"}
    if min_rating is not None:
        query["rating"] = {"$gte": min_rating}
    if min_year is not None:
        query["year"] = {"$gte": min_year}

    movies = []
    
    sort_direction = 1 if order == "asc" else -1
    sort_criteria = []
    if sort_by:
        sort_criteria.append((sort_by, sort_direction))
    else:
        # Default sort by rating if no other sort is specified
        sort_criteria.append(("rating", -1))

    cursor = collection.find(query)
    if sort_criteria:
        cursor = cursor.sort(sort_criteria)
        
    async for movie in cursor:
        movies.append(movie_helper(movie))
        
    if not movies:
        raise HTTPException(status_code=404, detail="No movies found matching your criteria.")
        
    return movies


# =====================================================================
# API ENDPOINT FOR CSV EXPORT
# =====================================================================
@app.get("/export/csv", summary="Export all movie data to a CSV file")
async def export_to_csv():
    """
    Fetches all movie data from the database and returns it as a
    downloadable CSV file, using a semicolon delimiter for Excel compatibility.
    """
    stream = io.StringIO()
    writer = csv.writer(stream, delimiter=';')

    # UPDATED headers to use the new runtime_minutes field
    headers = ["id", "title", "year", "rating", "director", "poster_url", "plot_summary", "genres", "runtime_minutes", "cast", "source_url"]
    writer.writerow(headers)

    movies_cursor = collection.find()
    async for movie in movies_cursor:
        genres_str = ", ".join(movie.get("genres", []))
        cast_str = " | ".join([c.get("actor", "") for c in movie.get("cast", [])])

        writer.writerow([
            str(movie["_id"]),
            movie.get("title"),
            movie.get("year"),
            movie.get("rating"),
            movie.get("director"),
            movie.get("poster_url"),
            movie.get("plot_summary"),
            genres_str,
            movie.get("runtime_minutes"), # UPDATED to use the clean field
            cast_str,
            movie.get("source_url"),
        ])
    
    stream.seek(0)
    
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=movies.csv"}
    )


# =====================================================================
# API ENDPOINT TO TRIGGER THE SCRAPER
# =====================================================================
def run_scraper_script():
    """
    Function that will be run in the background.
    It executes the scraper/scraper.py script using the same Python environment.
    """
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
    """
    Triggers the scraper script to run as a background process.
    The API will return a confirmation message immediately.
    """
    background_tasks.add_task(run_scraper_script)
    return {"message": "Scraping process started in the background. It will take several minutes to complete."}