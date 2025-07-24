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
# UPDATED, MORE ROBUST HELPER FUNCTION
# =====================================================================
def movie_helper(movie) -> dict:
    """
    Converts a movie document from the DB to a Python dict.
    Uses .get() to prevent errors if a field is missing.
    """
    return {
        "id": str(movie["_id"]),
        "title": movie.get("title"),
        "year": movie.get("year"),
        "rating": movie.get("rating"),
        "director": movie.get("director"),
        "poster_url": movie.get("poster_url"),
        "plot_summary": movie.get("plot_summary"),
        "genres": movie.get("genres", []), # Default to empty list
        # THE FIX IS HERE: Look for the new 'runtime_minutes' field
        "runtime_minutes": movie.get("runtime_minutes"),
        "cast": movie.get("cast", []), # Default to empty list
        "source_url": movie.get("source_url"),
    }