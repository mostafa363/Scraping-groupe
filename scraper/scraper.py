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
from tqdm import tqdm # For the progress bar

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
}

# =====================================================================
# FUNCTION TO GET MOVIE URLS (STABLE)
# =====================================================================
def get_movie_urls(list_url):
    print(f"Fetching movie URLs from: {list_url} using Selenium...")
    
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
    
    wait = WebDriverWait(driver, 15)
    urls = []

    try:
        driver.get(list_url)
        print("Browser session started. Clicking cookie banner if present...")
        
        try:
            accept_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Accept')]")))
            accept_button.click()
            time.sleep(1)
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
            if href and '/title/tt' in href:
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
# FUNCTION TO SCRAPE DETAILS (ROBUST & STABLE)
# =====================================================================
import re # Add this import to the top of your scraper.py file

def convert_runtime_to_minutes(runtime_str):
    """Converts a runtime string like '2h 22m' into total minutes."""
    if not isinstance(runtime_str, str):
        return None
    
    hours = 0
    minutes = 0
    
    # Find hours using regex
    hour_match = re.search(r'(\d+)h', runtime_str)
    if hour_match:
        hours = int(hour_match.group(1))
        
    # Find minutes using regex
    minute_match = re.search(r'(\d+)m', runtime_str)
    if minute_match:
        minutes = int(minute_match.group(1))
        
    total_minutes = (hours * 60) + minutes
    return total_minutes if total_minutes > 0 else None

def scrape_movie_details(url):
    """
    Scrapes, cleans, and gets extended details for a movie.
    """
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')

        # --- Scrape Raw Data ---
        raw_title = soup.find('h1').get_text(strip=True) if soup.find('h1') else "N/A"
        raw_year = soup.select_one('h1 ~ ul a').get_text(strip=True) if soup.select_one('h1 ~ ul a') else "N/A"
        raw_rating = soup.select_one('div[data-testid="hero-rating-bar__aggregate-rating__score"] span').get_text(strip=True) if soup.select_one('div[data-testid="hero-rating-bar__aggregate-rating__score"] span') else "N/A"
        raw_director = soup.select_one('li[data-testid="title-pc-principal-credit"] a').get_text(strip=True) if soup.select_one('li[data-testid="title-pc-principal-credit"] a') else "N/A"
        poster_url = soup.select_one('div[data-testid="hero-media__poster"] img')['src'] if soup.select_one('div[data-testid="hero-media__poster"] img') else "N/A"
        plot_summary = soup.select_one('span[data-testid="plot-l"]').get_text(strip=True) if soup.select_one('span[data-testid="plot-l"]') else "N/A"
        genres = [link.get_text(strip=True) for link in soup.select('div[data-testid="genres"] a')]
        
        runtime_text = "N/A"
        metadata_items = soup.select('h1 ~ ul li')
        for item in metadata_items:
            text = item.get_text()
            if 'h' in text or 'm' in text:
                runtime_text = text.strip()
                break
        
        cast = []
        cast_list_items = soup.select('div[data-testid="title-cast-item"]')[:5]
        for item in cast_list_items:
            actor = item.select_one('a[data-testid="title-cast-item__actor"]')
            character = item.select_one('a[data-testid="cast-item-character-name"]')
            cast.append({
                "actor": actor.get_text(strip=True) if actor else "N/A",
                "character": character.get_text(strip=True) if character else "N/A"
            })

        # --- Clean the Data ---
        try:
            clean_year = int(raw_year)
        except (ValueError, TypeError):
            clean_year = None
        try:
            clean_rating = float(raw_rating)
        except (ValueError, TypeError):
            clean_rating = None
            
        # Use our new function to clean the runtime
        clean_runtime_minutes = convert_runtime_to_minutes(runtime_text)
            
        movie_data = {
            "title": raw_title, "year": clean_year, "rating": clean_rating,
            "director": raw_director, "poster_url": poster_url, "plot_summary": plot_summary,
            "genres": genres, "runtime_minutes": clean_runtime_minutes, "cast": cast, "source_url": url
        }
        
        save_to_mongodb(movie_data)
        return movie_data

    except Exception as e:
        tqdm.write(f"❌ An unexpected error occurred while scraping {url}: {e}")
        return None
# =====================================================================
# MAIN EXECUTION BLOCK (STABLE)
# =====================================================================
if __name__ == "__main__":
    IMDB_TOP_250_URL = "https://www.imdb.com/chart/top/"
    
    movie_urls = get_movie_urls(IMDB_TOP_250_URL)
    
    if movie_urls:
        print(f"\n--- Starting to scrape {len(movie_urls)} individual movie pages ---\n")
        
        # tqdm will create a visual progress bar for the loop
        for url in tqdm(movie_urls, desc="Scraping Movies"):
            scrape_movie_details(url)
            time.sleep(1) # You can adjust the sleep time if needed
            
        print("\n--- All movies have been scraped and saved! ---")