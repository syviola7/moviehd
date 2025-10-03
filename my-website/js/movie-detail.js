const IMG_URL = 'https://image.tmdb.org/t/p/original';
const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae'; // Replace with your actual API key
const servers = {
  'server1': 'vidsrc.cc',
  'server2': 'vidsrc.me',
  'server3': 'player.videasy.net'
};

function loadMovieDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const movieData = JSON.parse(decodeURIComponent(urlParams.get('movie')));

  if (!movieData) {
    console.error('No movie data found');
    return;
  }

  // Set poster and backdrop
  document.getElementById('modal-image').src = `${IMG_URL}${movieData.poster_path}` || '';
  const backdrop = document.querySelector('.backdrop');
  if (backdrop && movieData.backdrop_path) {
    backdrop.style.backgroundImage = `url(${IMG_URL}${movieData.backdrop_path})`;
  }

  // Set title and description
  document.getElementById('modal-title').textContent = movieData.title || movieData.name || '';
  document.getElementById('modal-description').textContent = movieData.overview || '';

  // Set rating
  const ratingSpan = document.getElementById('modal-rating')?.querySelector('span');
  if (ratingSpan) {
    ratingSpan.textContent = movieData.vote_average ? (movieData.vote_average / 2).toFixed(1) : 'N/A';
  }

  // Set metadata (year and duration)
  const releaseYear = movieData.release_date 
    ? new Date(movieData.release_date).getFullYear() 
    : movieData.first_air_date 
    ? new Date(movieData.first_air_date).getFullYear() 
    : 'N/A';
  const duration = movieData.runtime 
    ? `${movieData.runtime} min` 
    : movieData.episode_run_time && movieData.episode_run_time.length > 0 
    ? `${movieData.episode_run_time[0]} min` 
    : `${Math.floor(Math.random() * 180) + 60} min`;
  document.getElementById('movie-meta').textContent = `${releaseYear} • HD • ${duration}`;

  // Fetch detailed metadata
  fetchDetailedMetadata(movieData.id, movieData.media_type, releaseYear);

  document.getElementById('play-button').onclick = () => playMovie(movieData);
  document.querySelectorAll('#server-selector button').forEach(button => {
    button.onclick = () => changeServer(button.id, movieData);
  });
}

async function fetchDetailedMetadata(itemId, mediaType, releaseYear) {
  try {
    const detailsRes = await fetch(`${BASE_URL}/${mediaType}/${itemId}?api_key=${API_KEY}`);
    const creditsRes = await fetch(`${BASE_URL}/${mediaType}/${itemId}/credits?api_key=${API_KEY}`);
    if (!detailsRes.ok || !creditsRes.ok) throw new Error(`HTTP error! status: ${detailsRes.status || creditsRes.status}`);

    const details = await detailsRes.json();
    const credits = await creditsRes.json();

    // Country
    const country = details.production_countries && details.production_countries.length > 0 
      ? details.production_countries[0].name 
      : 'N/A';
    document.getElementById('country').textContent = country;

    // Genre
    const genres = details.genres.map(genre => genre.name).join(', ') || 'Unknown';
    document.getElementById('genre').textContent = genres;

    // Year
    document.getElementById('year').textContent = releaseYear;

    // Director (for movies) or Creators (for TV)
    const director = mediaType === 'movie' 
      ? (credits.crew.find(person => person.job === 'Director')?.name || 'N/A')
      : (details.created_by && details.created_by.length > 0 ? details.created_by.map(creator => creator.name).join(', ') : 'N/A');
    document.getElementById('director').textContent = director;

    // Stars (main cast)
    const stars = credits.cast.slice(0, 3).map(actor => actor.name).join(', ') || 'N/A';
    document.getElementById('stars').textContent = stars;

    // Tags (based on media type)
    const tags = mediaType === 'tv' ? 'series' : 'movie';
    document.getElementById('tags').textContent = tags;

  } catch (error) {
    console.error('Error fetching detailed metadata:', error);
    document.getElementById('country').textContent = 'N/A';
    document.getElementById('genre').textContent = 'Unknown';
    document.getElementById('year').textContent = releaseYear || 'N/A';
    document.getElementById('director').textContent = 'N/A';
    document.getElementById('stars').textContent = 'N/A';
    document.getElementById('tags').textContent = 'N/A';
  }
}

function playMovie(movieData) {
  const iframe = document.getElementById('modal-video');
  const server = document.querySelector('#server-selector button[style*="e50914"]');
  if (server) {
    changeServer(server.id, movieData);
    iframe.style.display = 'block';
  } else {
    alert('Please select a server first.');
  }
}

function changeServer(serverId, movieData) {
  const server = servers[serverId];
  const type = movieData.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${movieData.id}`;
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${movieData.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${movieData.id}`;
  }

  document.getElementById('modal-video').src = embedURL;
  document.querySelectorAll('#server-selector button').forEach(btn => btn.style.backgroundColor = '#666');
  document.getElementById(serverId).style.backgroundColor = '#e50914';
}

window.onload = loadMovieDetails;