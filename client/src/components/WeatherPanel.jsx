import { useState, useEffect } from 'react';

const WEATHER_CODES = {
  0: { label: 'Clear sky', icon: '☀️', type: 'clear' },
  1: { label: 'Mainly clear', icon: '🌤️', type: 'clear' },
  2: { label: 'Partly cloudy', icon: '⛅', type: 'cloudy' },
  3: { label: 'Overcast', icon: '☁️', type: 'cloudy' },
  45: { label: 'Foggy', icon: '🌫️', type: 'cloudy' },
  48: { label: 'Rime fog', icon: '🌫️', type: 'cloudy' },
  51: { label: 'Light drizzle', icon: '🌦️', type: 'rain' },
  53: { label: 'Moderate drizzle', icon: '🌦️', type: 'rain' },
  55: { label: 'Dense drizzle', icon: '🌧️', type: 'rain' },
  61: { label: 'Slight rain', icon: '🌧️', type: 'rain' },
  63: { label: 'Moderate rain', icon: '🌧️', type: 'rain' },
  65: { label: 'Heavy rain', icon: '🌧️', type: 'heavyrain' },
  66: { label: 'Freezing rain', icon: '🌧️', type: 'rain' },
  67: { label: 'Heavy freezing rain', icon: '🌧️', type: 'heavyrain' },
  71: { label: 'Slight snow', icon: '🌨️', type: 'snow' },
  73: { label: 'Moderate snow', icon: '🌨️', type: 'snow' },
  75: { label: 'Heavy snow', icon: '❄️', type: 'snow' },
  77: { label: 'Snow grains', icon: '❄️', type: 'snow' },
  80: { label: 'Slight showers', icon: '🌦️', type: 'rain' },
  81: { label: 'Moderate showers', icon: '🌧️', type: 'rain' },
  82: { label: 'Violent showers', icon: '⛈️', type: 'heavyrain' },
  85: { label: 'Slight snow showers', icon: '🌨️', type: 'snow' },
  86: { label: 'Heavy snow showers', icon: '❄️', type: 'snow' },
  95: { label: 'Thunderstorm', icon: '⛈️', type: 'storm' },
  96: { label: 'Thunderstorm + hail', icon: '⛈️', type: 'storm' },
  99: { label: 'Thunderstorm + heavy hail', icon: '⛈️', type: 'storm' },
};

const WeatherPanel = ({ onWeatherChange }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // Refresh every 10 min
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = async () => {
    try {
      // Get location via browser geolocation
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: false });
      });

      const { latitude, longitude } = pos.coords;

      // Reverse geocode for city name
      try {
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const geoData = await geoRes.json();
        setLocationName(geoData.city || geoData.locality || geoData.principalSubdivision || 'Your Location');
      } catch { setLocationName('Your Location'); }

      // Fetch weather from Open-Meteo (free, no API key)
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day&timezone=auto`
      );
      const data = await res.json();

      if (data.current) {
        const w = {
          temp: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          windDir: data.current.wind_direction_10m,
          code: data.current.weather_code,
          isDay: data.current.is_day,
        };
        const codeInfo = WEATHER_CODES[w.code] || { label: 'Unknown', icon: 'Temprature', type: 'clear' };
        w.label = codeInfo.label;
        w.icon = codeInfo.icon;
        w.type = codeInfo.type;

        setWeather(w);
        setError('');
        if (onWeatherChange) onWeatherChange(w);
      }
    } catch (err) {
      console.warn('Weather fetch failed:', err.message);
      setError('Allow location access for weather');
      // Set a default clear weather so effects still work
      const fallback = { temp: 25, feelsLike: 25, humidity: 50, windSpeed: 8, code: 0, label: 'Clear sky', icon: '☀️', type: 'clear', isDay: 1 };
      setWeather(fallback);
      if (onWeatherChange) onWeatherChange(fallback);
    }
    setLoading(false);
  };

  const windDirection = (deg) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  if (loading) return <div className="card weather-card"><div className="empty-inline">Fetching weather…</div></div>;

  return (
    <div className="card weather-card">
      <div className="weather-top">
        <div className="weather-icon-big">{weather?.icon}</div>
        <div className="weather-main">
          <div className="weather-temp">{weather?.temp}°C</div>
          <div className="weather-label">{weather?.label}</div>
          {locationName && <div className="weather-location">📍 {locationName}</div>}
        </div>
      </div>
      {error && <div className="hint" style={{ color: 'var(--pink)' }}>{error}</div>}
      <div className="weather-details">
        <div className="weather-detail">
          <span className="weather-detail-icon">🌡️</span>
          <span className="weather-detail-label">Feels like</span>
          <span className="weather-detail-value">{weather?.feelsLike}°C</span>
        </div>
        <div className="weather-detail">
          <span className="weather-detail-icon">💧</span>
          <span className="weather-detail-label">Humidity</span>
          <span className="weather-detail-value">{weather?.humidity}%</span>
        </div>
        <div className="weather-detail">
          <span className="weather-detail-icon">💨</span>
          <span className="weather-detail-label">Wind</span>
          <span className="weather-detail-value">{weather?.windSpeed} km/h {weather?.windDir !== undefined ? windDirection(weather.windDir) : ''}</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;
