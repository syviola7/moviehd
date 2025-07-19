const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/'; // Removed '/original' to allow size flexibility
let currentItem;

// Cache for storing API responses
const apiCache = new Map();
const imageCache = new Map();

async function fetchWithCache(url) {
  if (apiCache.has(url)) {
    return apiCache.get(url);
  }
  const res = await fetch(url);
  const data = await res.json();
  apiCache.set(url, data);
  return data;
}

async function fetchTrending(type) {
  const url = `${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`;
  const data = await fetchWithCache(url);
  return data.results;
}

async function fetchTrendingSorted(type) {
  const results = await fetchTrending(type);
  return results.sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date));
}

async function fetchTrendingAnime() {
  let allResults = [];
  const pagePromises = [];
  
  for (let page = 1; page <= 3; page++) {
    const url = `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`;
    pagePromises.push(fetchWithCache(url));
  }

  const dataArray = await Promise.all(pagePromises);
  dataArray.forEach(data => {
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  });

  return allResults.sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date));
}

function displayBanner(item) {
  const banner = document.getElementById('banner');
  const bannerTitle = document.getElementById('banner-title');
  
  // Use lower resolution for banner (w1280 instead of original)
  banner.style.backgroundImage = `url(${IMG_URL}w1280${item.backdrop_path})`;
  bannerTitle.textContent = item.title || item.name;
  
  // Load higher quality image in background
  const img = new Image();
  img.src = `${IMG_URL}original${item.backdrop_path}`;
  img.onload = () => {
    banner.style.backgroundImage = `url(${img.src})`;
  };
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  items.forEach(item => {
    if (!item.poster_path) return;
    
    const img = document.createElement('img');
    // Use w342 for posters (optimal balance of quality/size)
    img.dataset.src = `${IMG_URL}w342${item.poster_path}`;
    img.alt = item.title || item.name;
    img.loading = 'lazy'; // Native lazy loading
    img.classList.add('lazy-poster');
    
    // Low-quality image placeholder (LQIP)
    img.style.background = '#f0f0f0';
    img.style.minWidth = '200px';
    img.style.minHeight = '300px';
    
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });

  // Enhanced lazy loading with IntersectionObserver
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('.lazy-poster');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            // Check if image is already in cache
            if (imageCache.has(img.dataset.src)) {
              img.src = imageCache.get(img.dataset.src);
            } else {
              img.src = img.dataset.src;
              img.onload = () => {
                imageCache.set(img.dataset.src, img.src);
                img.style.background = 'none';
              };
            }
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '200px' // Start loading 200px before entering viewport
    });

    lazyImages.forEach(img => observer.observe(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    document.querySelectorAll('.lazy-poster').forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  
  // Use higher quality image for modal but still not original size
  const modalImg = document.getElementById('modal-image');
  modalImg.src = `${IMG_URL}w500${item.poster_path}`;
  
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

// Rest of your functions remain the same (changeServer, closeModal, openSearchModal, etc.)
// ...

async function init() {
  try {
    // Load all data in parallel
    const [movies, tvShows, anime] = await Promise.all([
      fetchTrending('movie'),
      fetchTrending('tv'),
      fetchTrendingAnime()
    ]);
    
    displayBanner(movies[Math.floor(Math.random() * movies.length)]);
    displayList(movies, 'movies-list');
    displayList(tvShows, 'tvshows-list');
    displayList(anime, 'anime-list');
  } catch (error) {
    console.error('Initialization error:', error);
    // You might want to show a user-friendly error message here
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
    }
