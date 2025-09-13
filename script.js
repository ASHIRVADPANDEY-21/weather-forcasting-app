const OWM_KEY = 'da42843835de9f3842c445e0c521d128';
const geoInput = document.getElementById('city-input');
const btnSearch = document.getElementById('searchBtn');
const btnLocate = document.getElementById('locationBtn');


const elems = {
  nowTemp: document.querySelector('.current-weather h2'),
  nowDesc: document.querySelector('.current-weather .detail p:nth-child(3)'),
  nowIcon: document.querySelector('.weather-icon img'),
  dateText: document.querySelector('.card-footer p:first-child'),
  locText: document.querySelector('.card-footer p:last-child'),
  sunrise: document.querySelector('.sunrise-sunset .item:nth-child(1) h2'),
  sunset: document.querySelector('.sunrise-sunset .item:nth-child(2) h2'),
  humidity: document.getElementById('humidityval'),
  pressure: document.getElementById('pressureval'),
  visibility: document.getElementById('visbilityval'),
  wind: document.getElementById('windspeedval'),
  feelsLike: document.getElementById('feellikeval'),
  dayForecast: document.querySelector('.day-forecast'),
};


const aqiVal = document.querySelector('.Air-index');
const pollutants = ['pm2_5','pm10','so2','co','no','no2','nh3','o3'];
const pollutantEls = pollutants.map((key, i) => 
  document.querySelectorAll('.Air-indices .itme h2')[i]);


const hourlyCards = document.querySelectorAll('.hourly-forecasting .card');


// Format helper functions
function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit'
  });
}
function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString([], {
    weekday: 'short', month: 'short', day: 'numeric'
  });
}


// Geo fetch
async function fetchCoords(city) {
  const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OWM_KEY}`);
  return res.json();
}


// Main weather fetch
async function fetchWeather(lat, lon, locText = '') {
  try {
    const [weatherResp, forecastResp, pollutionResp] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`)
    ]);


    if (!weatherResp.ok || !forecastResp.ok || !pollutionResp.ok) {
      throw new Error('One or more API calls failed');
    }


    const weatherData = await weatherResp.json();
    const forecastData = await forecastResp.json();
    const pollutionData = await pollutionResp.json();


    renderCurrent(weatherData, locText);
    renderForecast(forecastData.list);
    renderPollution(pollutionData.list[0]);
  } catch (err) {
    console.error(err);
    alert('Failed to fetch weather data.');
  }
}


function renderCurrent(cur, loc) {
  elems.nowTemp.textContent = `${cur.main.temp.toFixed(1)}°C`;
  elems.nowDesc.textContent = cur.weather[0].description;
  elems.nowIcon.src = `https://openweathermap.org/img/wn/${cur.weather[0].icon}@2x.png`;
  elems.dateText.textContent = formatDate(cur.dt);
  elems.locText.textContent = loc;
  elems.sunrise.textContent = formatTime(cur.sys.sunrise);
  elems.sunset.textContent = formatTime(cur.sys.sunset);
  elems.humidity.textContent = `${cur.main.humidity}%`;
  elems.pressure.textContent = `${cur.main.pressure} hPa`;
  elems.visibility.textContent = `${(cur.visibility / 1000).toFixed(1)} km`;
  elems.wind.textContent = `${cur.wind.speed} m/s`;
  elems.feelsLike.textContent = `${cur.main.feels_like.toFixed(1)}°C`;
}


function renderForecast(forecastList) {
  elems.dayForecast.innerHTML = '';
  const dayMap = new Map();


  forecastList.forEach(f => {
    const date = new Date(f.dt * 1000).toDateString();
    if (!dayMap.has(date)) dayMap.set(date, f);
  });


  Array.from(dayMap.values()).slice(1, 6).forEach(f => {
    const div = document.createElement('div');
    div.className = 'forecast-itme';
    div.innerHTML = `
      <div class="icon-wrapper">
        <img src="https://openweathermap.org/img/wn/${f.weather[0].icon}@2x.png">
        <span>${f.main.temp.toFixed(1)}°C</span>
      </div>
      <p>${formatDate(f.dt)}</p>
      <p>${f.weather[0].description}</p>
    `;
    elems.dayForecast.appendChild(div);
  });
}


function renderPollution(pol) {
  const { aqi } = pol.main;
  aqiVal.textContent = aqi;
  aqiVal.className = `Air-index aqi-${aqi}`;


  pollutants.forEach((key, i) => {
    pollutantEls[i].textContent = pol.components[key] ?? '–';
  });
}


// Event listeners
btnSearch.addEventListener('click', async () => {
  const city = geoInput.value.trim();
  if (!city) return;
  const arr = await fetchCoords(city);
  if (!arr.length) return alert('City not found');
  const { lat, lon, name, country } = arr[0];
  fetchWeather(lat, lon, `${name}, ${country}`);
});


btnLocate.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(pos => {
    fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Your Location');
  }, () => alert('Geolocation denied.'));
}); 