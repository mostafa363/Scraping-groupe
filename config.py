# config.py

import os
from dotenv import load_dotenv

# This line looks for a .env file in the project root and loads its variables
load_dotenv()

# Now we can safely get the URI from the environment variables
# The second argument is a default value in case the variable is not found
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")