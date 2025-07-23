# backend/database.py

import os
from dotenv import load_dotenv
import motor.motor_asyncio # The async driver for MongoDB
from bson import ObjectId # To handle MongoDB's unique IDs

# Load environment variables from the .env file in the project root
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

# --- Database Connection ---
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
# The database name is part of your MONGO_URI, e.g., 'metflix_db'
# Motor gets it automatically from the URI. If not, you can specify it:
# db = client.metflix_db
db = client.get_default_database() 
collection = db.movies


# --- Helper Functions ---

# Helper to convert a movie document from DB to a Python dict
def movie_helper(movie) -> dict:
    return {
        "id": str(movie["_id"]), # Convert ObjectId to string
        "title": movie["title"],
        "year": movie["year"],
        "rating": movie["rating"],
        "director": movie["director"],
        "poster_url": movie["poster_url"],
        "plot_summary": movie["plot_summary"],
        "genres": movie["genres"],
        "runtime": movie["runtime"],
        "cast": movie["cast"],
        "source_url": movie["source_url"],
    }