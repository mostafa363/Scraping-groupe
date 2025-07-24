# scraper/pipeline.py

from pymongo import MongoClient
import os
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables from the .env file
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

def save_to_mongodb(movie_data):
    """
    Connects to MongoDB and saves a single movie's data.
    Uses 'update_one' with 'upsert=True' to prevent duplicate entries based on the
    source IMDb URL.
    """
    if not MONGO_URI:
        # Use tqdm.write so the message doesn't interfere with the progress bar
        tqdm.write("❌ MONGO_URI not found in .env file. Cannot save to database.")
        return

    client = None
    try:
        # 1. Establish a connection to the MongoDB server
        client = MongoClient(MONGO_URI)
        
        # 2. Select your database (the default one from the URI)
        db = client.get_default_database()
        
        # 3. Select your collection
        collection = db['movies']
        
        # 4. Use 'update_one' for an "upsert" operation.
        # This checks if a document with the 'source_imdb_url' already exists.
        # If it does, it updates it. If not, it inserts it.
        # This is the key fix to match the scraper's data structure.
        collection.update_one(
            {'source_imdb_url': movie_data['source_imdb_url']},
            {'$set': movie_data},
            upsert=True
        )
        
        # Use tqdm.write for clean output with the progress bar
        tqdm.write(f"✅ Successfully saved '{movie_data.get('title', 'N/A')}' to MongoDB.")
        
    except KeyError as e:
        # This will catch if 'source_imdb_url' is missing for some reason
        tqdm.write(f"❌ Error saving to MongoDB: Missing key {e} in movie data.")
        
    except Exception as e:
        # Catch other potential database errors (e.g., connection issues)
        tqdm.write(f"❌ An unexpected error occurred with MongoDB: {e}")
        
    finally:
        # 5. Ensure the connection is always closed
        if client:
            client.close()