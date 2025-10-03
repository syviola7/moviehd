const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;

async function fetchTrending(type) {
  try {
    const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log(`Fetched ${type} data:`, data.results);
    return data.results;
  } catch (error) {
    console.error(`Error fetching trending ${type}:`, error);
    return [];
  }
}

async function fetchTrendingSorted(type) {
  const results = await fetchTrending(type);
  return results.sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date));
}

async function fetchTrendingAnime() {
  try {
    let allResults = [];
    const pagePromises = [];
    for (let page = 1; page <= 3; page++) {
      pagePromises.push(fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`));
    }

    const responses = await Promise.all(pagePromises);
    for (const res of responses) {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const filtered = data.results.filter(item =>
        item.original_language === 'ja' && item.genre_ids.includes(16)
      );
      allResults = allResults.concat(filtered);
    }
    console.log('Fetched anime data:', allResults);
    return allResults.sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date));
  } catch (error) {
    console.error('Error fetching trending anime:', error);
    return [];
  }
}

function displayBanner(item) {
  const banner = document.getElementById('banner');
  if (banner && item && item.backdrop_path) {
    banner.style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
    document.getElementById('banner-title').textContent = item.title || item.name;
  } else {
    console.warn('No valid banner item or element:', item, banner);
  }
}

function displayList(items, containerId, limit = items.length) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container ${containerId} not found in DOM`);
    return;
  }
  container.innerHTML = '';
  console.log(`Displaying ${Math.min(limit, items.length)} items in ${containerId}:`, items);
  items.slice(0, limit).forEach(item => {
    if (!item.poster_path) {
      console.warn('Item missing poster_path:', item);
      return;
    }
    const div = document.createElement('div');
    div.style.position = 'relative';

    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.style.width = '200px';
    img.style.height = '300px';
    img.style.objectFit = 'cover';
    img.onclick = () => showDetails(item);

    const span = document.createElement('span');
    span.style.position = 'absolute';
    span.style.top = '5px';
    span.style.right = '5px';
    span.style.backgroundColor = 'red';
    span.style.color = 'white';
    span.style.padding = '2px 5px';
    span.style.fontSize = '12px';
    span.style.borderRadius = '3px';
    span.textContent = 'HD';

    const p1 = document.createElement('p');
    p1.style.margin = '5px 0';
    p1.style.fontSize = '14px';
    p1.textContent = (item.title || item.name).length > 20 
      ? (item.title || item.name).substring(0, 17) + '...' 
      : item.title || item.name;

    const p2 = document.createElement('p');
    p2.style.margin = '0';
    p2.style.fontSize = '12px';
    p2.style.color = '#ccc';
    const releaseYear = item.release_date 
      ? new Date(item.release_date).getFullYear() 
      : item.first_air_date 
      ? new Date(item.first_air_date).getFullYear() 
      : 'N/A';
    p2.textContent = `${releaseYear} • ${Math.floor(Math.random() * 180) + 60} min`;

    div.appendChild(img);
    div.appendChild(span);
    div.appendChild(p1);
    div.appendChild(p2);
    container.appendChild(div);
  });
}

function showDetails(item) {
  const query = encodeURIComponent(JSON.stringify(item));
  console.log('Redirecting to:', `movie-detail.html?movie=${query}`); // Debug log to confirm click
  window.location.href = `movie-detail.html?movie=${query}`;
}

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  document.getElementById('modal-video').src = embedURL;
}

async function searchMovies() {
  const query = document.getElementById('search-input').value;
  const dropdown = document.getElementById('search-dropdown');
  dropdown.innerHTML = ''; // Clear previous results
  dropdown.classList.remove('active');

  if (!query.trim()) return;

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
  const data = await res.json();
  const results = data.results.filter(result => result.poster_path).slice(0, 5); // Limit to 5 results

  if (results.length > 0) {
    dropdown.classList.add('active');
    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'search-result-card';
      div.onclick = () => {
        closeSearchDropdown();
        showDetails(item);
      };

      const img = document.createElement('img');
      img.src = `${IMG_URL}${item.poster_path}`;
      img.alt = item.title || item.name;

      const info = document.createElement('div');
      info.className = 'info';

      const title = document.createElement('h3');
      title.textContent = item.title || item.name;

      const details = document.createElement('p');
      details.innerHTML = `★ ${item.vote_average.toFixed(1)} · ${item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}`;

      info.appendChild(title);
      info.appendChild(details);
      div.appendChild(img);
      div.appendChild(info);
      dropdown.appendChild(div);
    });

    // Add single "View all" link
    const viewAll = document.createElement('a');
    viewAll.href = '#';
    viewAll.className = 'view-all';
    viewAll.textContent = 'View all';
    viewAll.onclick = (event) => {
      event.preventDefault();
      window.location.href = `search.html?query=${encodeURIComponent(query)}`;
    };
    dropdown.appendChild(viewAll);
  }
}

// Event listener with debounce
document.getElementById('search-input')?.addEventListener('input', debounce(searchMovies, 300));

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Ensure these functions are defined elsewhere in your code
function closeSearchDropdown() {
  const dropdown = document.getElementById('search-dropdown');
  if (dropdown) dropdown.classList.remove('active');
}

function showDetails(item) {
  const query = encodeURIComponent(JSON.stringify(item));
  window.location.href = `movie-detail.html?movie=${query}`;
}


// ... (keep all existing functions like fetchTrending, displayBanner, etc. as they are)

function displaySearchResults() {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('query');
  if (!query) {
    const searchResults = document.getElementById('search-results');
    if (searchResults) searchResults.innerHTML = '<p>No search query provided.</p>';
    return;
  }

  const searchResults = document.getElementById('search-results');
  if (!searchResults) {
    console.error('Search results container not found!');
    return;
  }
  searchResults.innerHTML = '<p>Loading...</p>';

  try {
    // Use allorigins.win proxy to bypass CORS
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const apiUrl = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${decodeURIComponent(query)}`;
    fetch(proxyUrl + encodeURIComponent(apiUrl))
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        searchResults.innerHTML = '';
        const results = data.results.filter(result => result.poster_path);
        if (results.length === 0) {
          searchResults.innerHTML = `<p>No results found for "${decodeURIComponent(query)}".</p>`;
          return;
        }
        results.forEach(item => {
          const div = document.createElement('div');
          div.className = 'card';
          const img = document.createElement('img');
          img.src = `${IMG_URL}${item.poster_path}`;
          img.alt = item.title || item.name;
          img.style.width = '200px';
          img.style.height = '300px';
          img.onclick = () => showDetails(item);

          const p1 = document.createElement('p');
          p1.textContent = item.title || item.name;
          p1.style.margin = '5px 0';
          p1.style.fontSize = '14px';

          const p2 = document.createElement('p');
          p2.textContent = `${item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'} • ${item.runtime || Math.floor(Math.random() * 180) + 60} min`;
          p2.style.margin = '0';
          p2.style.fontSize = '12px';
          p2.style.color = '#ccc';

          div.appendChild(img);
          div.appendChild(p1);
          div.appendChild(p2);
          searchResults.appendChild(div);
        });
      })
      .catch(error => {
        console.error('Error fetching search results:', error);
        searchResults.innerHTML = '<p>Error loading results. Please try again later.</p>';
      });
  } catch (error) {
    console.error('Search results error:', error);
    searchResults.innerHTML = '<p>Error loading results. Please check your connection.</p>';
  }
}

// Ensure initialization runs on the correct page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('index.html')) {
    init();
  } else if (window.location.pathname.includes('search.html')) {
    displaySearchResults();
  }
});


// Ensure the function runs when search.html loads
if (window.location.pathname.includes('search.html')) {
  document.addEventListener('DOMContentLoaded', displaySearchResults);
}


function closeSearchDropdown() {
  const dropdown = document.getElementById('search-dropdown');
  dropdown.classList.remove('active');
}

document.addEventListener('click', (event) => {
  const searchContainer = document.querySelector('.search-container');
  if (!searchContainer.contains(event.target)) {
    closeSearchDropdown();
  }
});

async function init() {
  try {
    const movies = await fetchTrending('movie');
    const tvShows = await fetchTrendingSorted('tv');
    const anime = await fetchTrendingAnime();

    const recommended = [...movies.slice(0, 15)];
    console.log('Combined recommended items:', recommended);
    displayList(recommended, 'recommended-list');
    displayList(tvShows, 'tv-shows-list', 16); // 16 items to match 4 rows with wrapping
    displayList(anime, 'anime-list', 16); // 16 items to match 4 rows with wrapping
  } catch (error) {
    console.error('Error in init:', error);
  }
}

init();