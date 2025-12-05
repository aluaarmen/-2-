const placesUrl = './places.json';
const weatherDiv = document.getElementById('weather');
const statusDiv = document.getElementById('status');
const placesContainer = document.getElementById('places-container');

// Преобразуем градусы в радианы
function deg2rad(deg) { return deg * (Math.PI / 180); }

// Вычисляем расстояние между двумя координатами
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

// Загружаем список мест из JSON
async function fetchPlaces() {
  try {
    const resp = await fetch(placesUrl);
    return await resp.json();
  } catch (e) {
    console.error('Ошибка загрузки places.json', e);
    return [];
  }
}

// Получаем погоду с Open-Meteo API
async function fetchWeather(lat, lon) {
  try {
    const resp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const data = await resp.json();
    return data.current_weather;
  } catch (e) {
    console.warn('Ошибка погоды', e);
    return null;
  }
}

// Сохраняем в избранное
function saveFavorite(id) {
  const fav = JSON.parse(localStorage.getItem('favorites') || '[]');
  if (!fav.includes(id)) {
    fav.push(id);
    localStorage.setItem('favorites', JSON.stringify(fav));
  }
}

// Создаём карточку достопримечательности
function createCard(place, userLat, userLon) {
  const card = document.createElement('div');
  card.className = 'card';

  const img = document.createElement('img');
  img.src = place.image;
  img.alt = place.name;
  card.append(img);

  const content = document.createElement('div');
  content.className = 'card-content';

  const title = document.createElement('h3');
  title.textContent = place.name;

  const desc = document.createElement('p');
  desc.textContent = place.description;

  content.append(title, desc);

  if (userLat != null && userLon != null) {
    const dist = distanceKm(userLat, userLon, place.lat, place.lon);
    const pDist = document.createElement('p');
    pDist.textContent = `Расстояние: ${dist} km`;
    content.append(pDist);
  }

  card.append(content);

  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const favBtn = document.createElement('button');
  favBtn.textContent = '⭐ В избранное';
  favBtn.onclick = () => saveFavorite(place.id);

  const moreBtn = document.createElement('button');
  moreBtn.textContent = 'Подробнее';

  footer.append(favBtn, moreBtn);
  card.append(footer);

  return card;
}

// Инициализация приложения
async function init() {
  const places = await fetchPlaces();
  let userLat = null, userLon = null;

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      userLat = pos.coords.latitude;
      userLon = pos.coords.longitude;

      // Погода
      const weather = await fetchWeather(userLat, userLon);
      if (weather) {
        weatherDiv.textContent = `Погода: ${weather.temperature} °C, скорость ветра: ${weather.windspeed} км/ч`;
      } else {
        weatherDiv.textContent = 'Погода недоступна';
      }

      // Карточки
      places.forEach(place => {
        const card = createCard(place, userLat, userLon);
        placesContainer.append(card);
      });
    }, () => {
      statusDiv.textContent = 'Геолокация недоступна';
      places.forEach(place => {
        const card = createCard(place, null, null);
        placesContainer.append(card);
      });
    });
  } else {
    statusDiv.textContent = 'Геолокация не поддерживается';
    places.forEach(place => {
      const card = createCard(place, null, null);
      placesContainer.append(card);
    });
  }
}

// Запуск после загрузки DOM
window.addEventListener('DOMContentLoaded', init);
