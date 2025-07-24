# scraper/scraper.py

import requests
from bs4 import BeautifulSoup
import time
import re
from urllib.parse import quote

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

from pipeline import save_to_mongodb
from tqdm import tqdm

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
}

# =====================================================================
# FUNCTION TO GET MOVIE URLS (STABLE)
# =====================================================================
def get_movie_urls(list_url):
    print(f"Fetching movie URLs from: {list_url} using Selenium...")
    
    # Configure Selenium WebDriver
    service = Service(executable_path='./chromedriver.exe')
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('user-agent=' + HEADERS['User-Agent'])
    options.add_argument("--lang=en-US")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(service=service, options=options)
    wait = WebDriverWait(driver, 20) # Increased wait time for reliability
    urls = []

    try:
        driver.get(list_url)
        print("Browser session started. Waiting for page to load...")
        
        # Scroll down to ensure all movies are loaded on the page
        print("Scrolling down to load all movies...")
        body = wait.until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
        for _ in range(12): # Increased scroll count
            body.send_keys(Keys.PAGE_DOWN)
            time.sleep(0.5)

        print("Finished scrolling. Finding all link elements...")
        
        # Wait for movie links to be present
        movie_elements = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a.ipc-title-link-wrapper")))
        print(f"Found {len(movie_elements)} potential link elements. Filtering now...")

        seen_urls = set()
        for link_element in movie_elements:
            href = link_element.get_attribute('href')
            if href and '/title/tt' in href:
                # Get the base URL without query parameters
                full_url = href.split('?')[0]
                if full_url not in seen_urls:
                    seen_urls.add(full_url)
                    urls.append(full_url)

    except Exception as e:
        print(f"❌ An error occurred during Selenium navigation: {e}")

    finally:
        print("Closing the browser session.")
        driver.quit()

    # Limit to a maximum of 250 URLs
    final_urls = urls[:250]
    
    print(f"✅ Found {len(final_urls)} movie URLs after filtering.")
    return final_urls

# =====================================================================
# REWRITTEN FUNCTION TO GET ROTTEN TOMATOES DATA (MORE ROBUST)
# =====================================================================
def get_rotten_tomatoes_data(movie_title, movie_year):
    """
    Searches Rotten Tomatoes and scrapes scores directly from the search results page.
    This is more efficient and less likely to break than visiting each movie page.
    """
    default_rt_data = {"rotten_tomatoes_url": "N/A", "tomatometer_score": None, "audience_score": None}
    try:
        search_query = quote(movie_title)
        search_url = f"https://www.rottentomatoes.com/search?search={search_query}"
        
        # Use a timeout to prevent the script from hanging indefinitely
        response = requests.get(search_url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # The search results are within a <search-page-result> custom element
        search_results_container = soup.find("search-page-result")
        if not search_results_container:
            return default_rt_data

        # Find all individual movie results within the container
        movie_results = search_results_container.find_all("search-page-media-row")

        for movie in movie_results:
            try:
                # Match the movie by its release year to find the correct entry
                release_year = int(movie.get('releaseyear', 0))
                if release_year == movie_year:
                    tomatometer = movie.get('tomatometerscore')
                    audience_score = movie.get('audiencescore')
                    
                    # The URL is in an <a> tag within the result
                    link_tag = movie.find('a', {'data-qa': 'info-name'})
                    movie_url = link_tag['href'] if link_tag else "N/A"
                    
                    return {
                        "rotten_tomatoes_url": movie_url,
                        "tomatometer_score": int(tomatometer) if tomatometer else None,
                        "audience_score": int(audience_score) if audience_score else None
                    }
            except (ValueError, TypeError, AttributeError):
                # If one search result has bad data, skip it and check the next one
                continue 

        return default_rt_data # Return default if no matching movie was found

    except Exception as e:
        # Catch errors from the request (e.g., timeout, connection error)
        tqdm.write(f"⚠️ Could not fetch RT data for '{movie_title}': {type(e).__name__}")
        return default_rt_data

# =====================================================================
# FUNCTION TO SCRAPE AND PROCESS ALL DETAILS (IMDB + RT)
# =====================================================================
def convert_runtime_to_minutes(runtime_str):
    if not isinstance(runtime_str, str): return None
    hours = int(re.search(r'(\d+)h', runtime_str).group(1)) if 'h' in runtime_str else 0
    minutes = int(re.search(r'(\d+)m', runtime_str).group(1)) if 'm' in runtime_str else 0
    total_minutes = (hours * 60) + minutes
    return total_minutes if total_minutes > 0 else None

def scrape_movie_details(url):
    """
    Scrapes all data for a single movie from IMDb, then calls the Rotten Tomatoes
    function to get additional scores.
    """
    try:
        # Use a timeout to prevent hanging
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')

        # --- Scrape Raw Data from IMDb ---
        raw_title = soup.find('h1').get_text(strip=True) if soup.find('h1') else "N/A"
        raw_year = soup.select_one('h1 ~ ul a').get_text(strip=True) if soup.select_one('h1 ~ ul a') else "N/A"
        raw_rating = soup.select_one('div[data-testid="hero-rating-bar__aggregate-rating__score"] span').get_text(strip=True) if soup.select_one('div[data-testid="hero-rating-bar__aggregate-rating__score"] span') else "N/A"
        raw_director = soup.select_one('li[data-testid="title-pc-principal-credit"] a').get_text(strip=True) if soup.select_one('li[data-testid="title-pc-principal-credit"] a') else "N/A"
        poster_img = soup.select_one('div[data-testid="hero-media__poster"] img')
        poster_url = poster_img['src'] if poster_img else "N/A"
        plot_summary = soup.select_one('span[data-testid="plot-l"]').get_text(strip=True) if soup.select_one('span[data-testid="plot-l"]') else "N/A"
        genres = [link.get_text(strip=True) for link in soup.select('div[data-testid="genres"] a')]
        
        runtime_text = next((item.get_text(strip=True) for item in soup.select('h1 ~ ul li') if 'h' in item.get_text() or 'm' in item.get_text()), "N/A")
        
        cast = []
        for item in soup.select('div[data-testid="title-cast-item"]')[:5]:
            actor = item.select_one('a[data-testid="title-cast-item__actor"]')
            character = item.select_one('a[data-testid="cast-item-character-name"]')
            cast.append({
                "actor": actor.get_text(strip=True) if actor else "N/A",
                "character": character.get_text(strip=True) if character else "N/A"
            })

        # --- Clean and Structure Data ---
        clean_year = int(raw_year) if raw_year.isdigit() else None
        clean_rating = float(raw_rating) if raw_rating.replace('.', '', 1).isdigit() else None
        clean_runtime_minutes = convert_runtime_to_minutes(runtime_text)
            
        movie_data = {
            "title": raw_title, 
            "year": clean_year, 
            "imdb_rating": clean_rating,
            "director": raw_director, 
            "poster_url": poster_url, 
            "plot_summary": plot_summary,
            "genres": genres, 
            "runtime_minutes": clean_runtime_minutes, 
            "cast": cast, 
            "source_imdb_url": url
        }
        
        # --- Scrape Rotten Tomatoes Data and Add to Dictionary ---
        if raw_title != "N/A" and clean_year is not None:
            tqdm.write(f"Fetching RT data for: {raw_title} ({clean_year})...")
            rt_data = get_rotten_tomatoes_data(raw_title, clean_year)
            movie_data.update(rt_data)
        else:
            movie_data.update({"rotten_tomatoes_url": "N/A", "tomatometer_score": None, "audience_score": None})
        
        # --- Save Final Record to Database ---
        save_to_mongodb(movie_data)
        return movie_data

    except Exception as e:
        tqdm.write(f"❌ An error occurred scraping {url}: {type(e).__name__}")
        return None

# =====================================================================
# MAIN EXECUTION BLOCK
# =====================================================================
if __name__ == "__main__":
    IMDB_TOP_250_URL = "https://www.imdb.com/chart/top/"
    
    movie_urls = get_movie_urls(IMDB_TOP_250_URL)
    
    if movie_urls:
        print(f"\n--- Starting to scrape {len(movie_urls)} individual movie pages ---\n")
        
        for url in tqdm(movie_urls, desc="Scraping Movies"):
            scrape_movie_details(url)
            time.sleep(1.5) # A respectful delay to avoid getting blocked
            
        print("\n--- All movies have been scraped and saved! ---")