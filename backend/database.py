# backend/database.py

import os
from dotenv import load_dotenv
import motor.motor_asyncio
from bson import ObjectId

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client.get_default_database() 
collection = db.movies

# =====================================================================
# THE FULLY UPDATED HELPER FUNCTION
# =====================================================================
def movie_helper(movie) -> dict:
    """
    Converts a movie document from the DB to a Python dict.
    This version is updated to handle the combined IMDb and Rotten Tomatoes data.
    """
    return {
        "id": str(movie["_id"]),
        "title": movie.get("title"),
        "year": movie.get("year"),
        "director": movie.get("director"),
        "poster_url": movie.get("poster_url"),
        "plot_summary": movie.get("plot_summary"),
        "genres": movie.get("genres", []),
        "runtime_minutes": movie.get("runtime_minutes"),
        "cast": movie.get("cast", []),

        # --- UPDATED & NEW FIELDS ---
        "imdb_rating": movie.get("imdb_rating"),           # RENAMED from 'rating'
        "tomatometer_score": movie.get("tomatometer_score"), # NEW field
        "audience_score": movie.get("audience_score"),       # NEW field
        
        "source_imdb_url": movie.get("source_imdb_url"),   # RENAMED from 'source_url'
        "rotten_tomatoes_url": movie.get("rotten_tomatoes_url") # NEW field
    }