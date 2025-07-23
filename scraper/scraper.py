# scraper/scraper.py

import requests
from bs4 import BeautifulSoup
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from pipeline import save_to_mongodb

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
}

# =====================================================================
# FINAL WORKING VERSION
# =====================================================================
def get_movie_urls(list_url):
    print(f"Fetching movie URLs from: {list_url} using Selenium...")
    
    service = Service(executable_path='./chromedriver.exe')
    options = webdriver.ChromeOptions()
    
    # --- Options to make scraper run cleanly and look like a real user ---
    options.add_argument('--headless') # Run in the background (no UI pop-up)
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('user-agent=' + HEADERS['User-Agent'])
    options.add_argument("--lang=en-US") # Request the English version of the site
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(service=service, options=options)
    
    wait = WebDriverWait(driver, 15)
    urls = []

    try:
        driver.get(list_url)
        print("Browser session started. Clicking cookie banner if present...")
        
        try:
            accept_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Accept')]")))
            accept_button.click()
            time.sleep(1) # Give page time to react
        except Exception:
            print("Cookie banner not found or could not be clicked. Continuing...")

        print("Scrolling down to load all movies...")
        body = driver.find_element(By.TAG_NAME, 'body')
        for i in range(10): 
            body.send_keys(Keys.PAGE_DOWN)
            time.sleep(0.5) 

        print("Finished scrolling. Finding all link elements...")
        
        movie_elements = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a.ipc-title-link-wrapper")))
        print(f"Found {len(movie_elements)} potential link elements. Now filtering...")

        seen_urls = set()
        for link_element in movie_elements:
            href = link_element.get_attribute('href')
            
            # --- THE FIX IS HERE ---
            # We check if the full URL contains the movie path, instead of what it starts with.
            if href and '/title/tt' in href:
                # The href is already a full URL, we just need to clean the '?ref_...' part
                full_url = href.split('?')[0]
                if full_url not in seen_urls:
                    seen_urls.add(full_url)
                    urls.append(full_url)

    except Exception as e:
        print(f"❌ An error occurred during Selenium navigation: {e}")

    finally:
        print("Closing the browser session.")
        driver.quit()

    final_urls = urls[:250]
    
    print(f"✅ Found {len(final_urls)} movie URLs after filtering.")
    return final_urls

# =====================================================================
# SCRAPE DETAILS FUNCTION (No changes needed)
# =====================================================================
# In scraper/scraper.py, replace your scrape_movie_details function with this one.

# =====================================================================
# FUNCTION WITH IMAGE URL SCRAPING & DATA CLEANING
# =====================================================================
def scrape_movie_details(url):
    """
    Scrapes, cleans, and gets the poster image URL for a movie,
    then sends the data to the pipeline.
    """
    print(f"--- Scraping: {url} ---")
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')

        # --- Scrape Raw Data ---
        title_element = soup.find('h1')
        raw_title = title_element.get_text(strip=True) if title_element else "N/A"

        year_link = soup.select_one('h1 ~ ul a')
        raw_year = year_link.get_text(strip=True) if year_link else "N/A"

        rating_span = soup.select_one('div[data-testid="hero-rating-bar__aggregate-rating__score"] span')
        raw_rating = rating_span.get_text(strip=True) if rating_span else "N/A"

        director_link = soup.select_one('li[data-testid="title-pc-principal-credit"] a')
        raw_director = director_link.get_text(strip=True) if director_link else "N/A"

        # --- NEW: Scrape Poster Image URL ---
        # This selector targets the <img> tag within the poster's container.
        poster_img = soup.select_one('div[data-testid="hero-media__poster"] img')
        # We get the 'src' attribute, which contains the image URL.
        poster_url = poster_img['src'] if poster_img else "N/A"
        
        # --- Clean the Data ---
        clean_title = raw_title
        clean_director = raw_director
        
        try:
            clean_year = int(raw_year)
        except (ValueError, TypeError):
            clean_year = None

        try:
            clean_rating = float(raw_rating)
        except (ValueError, TypeError):
            clean_rating = None

        # --- Add the new poster_url field to the dictionary ---
        movie_data = {
            "title": clean_title,
            "year": clean_year,
            "rating": clean_rating,
            "director": clean_director,
            "poster_url": poster_url, # New field
            "source_url": url
        }
        
        # Updated print statement to show the new data
        print(f"Data: {clean_title} ({clean_year}) - {clean_rating} - {clean_director}")
        print(f"Poster URL: {poster_url}")
        
        save_to_mongodb(movie_data)
        
        return movie_data

    except requests.exceptions.RequestException as e:
        print(f"❌ An error occurred during scraping: {e}")
        return None
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        return None
# =====================================================================
# MAIN EXECUTION BLOCK (No changes needed)
# =====================================================================
if __name__ == "__main__":
    IMDB_TOP_250_URL = "https://www.imdb.com/chart/top/"
    
    movie_urls = get_movie_urls(IMDB_TOP_250_URL)

    from tqdm import tqdm
    
    if movie_urls:
        print(f"\n--- Starting to scrape {len(movie_urls)} individual movie pages ---\n")
        for url in tqdm(movie_urls, desc="Scraping Movies"):
            scrape_movie_details(url)
            print("--- Waiting 1 second before next scrape ---\n")
            time.sleep(1)
        print("\n--- All movies have been scraped and saved! ---")