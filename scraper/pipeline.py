# scraper/pipeline.py

from pymongo import MongoClient
import os
from dotenv import load_dotenv

# We need to load the environment variables from the .env file
# This is necessary because this script is run via the scraper, but needs the secrets itself
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

def save_to_mongodb(movie_data):
    """
    Connects to the MongoDB database and saves a single movie's data.
    It uses 'update_one' with 'upsert=True' to avoid creating duplicate entries.
    """
    if not MONGO_URI:
        print("❌ MONGO_URI not found. Make sure your .env file is correct.")
        return

    client = None # Initialize client to None to ensure it exists in the finally block
    try:
        # 1. Establish a connection to the MongoDB server
        client = MongoClient(MONGO_URI)
        
        # 2. Select your database
        # You can specify the database name directly in your connection string if you want
        db = client.get_default_database() # Or use client['imdb_project']
        
        # 3. Select your collection
        collection = db['movies']
        
        # 4. Insert the data using upsert
        collection.update_one(
            {'source_url': movie_data['source_url']},
            {'$set': movie_data},
            upsert=True
        )
        
        print(f"✅ Successfully saved '{movie_data['title']}' to MongoDB.")
        
    except Exception as e:
        print(f"❌ Error saving to MongoDB: {e}")
        
    finally:
        # 5. Ensure the connection is closed
        if client:
            client.close()