import { useState, useEffect } from 'react';
import axios from "axios";
import './WeatherApp.css';

function App() {
  const [city, setCity] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Save recent searches to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const getWeather = async () => {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post("http://localhost:5000/api/weather", { city });
      setResult(response.data);
      
      // Add to recent searches if not already there
      if (!recentSearches.includes(city)) {
        const updatedSearches = [city, ...recentSearches.slice(0, 4)];
        setRecentSearches(updatedSearches);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching weather data");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      getWeather();
    }
  };

  const searchFromRecent = (savedCity) => {
    setCity(savedCity);
    setTimeout(() => getWeather(), 0);
  };

  const getWeatherIcon = (description) => {
    if (!description) return "☁️";
    
    description = description.toLowerCase();
    if (description.includes('clear')) return "☀️";
    if (description.includes('cloud')) return "🌥️";
    if (description.includes('rain')) return "🌧️";
    if (description.includes('snow')) return "❄️";
    if (description.includes('thunder')) return "⛈️";
    if (description.includes('drizzle')) return "🌦️";
    if (description.includes('mist') || description.includes('fog')) return "🌫️";
    return "🌡️";
  };

  const kelvinToCelsius = (kelvin) => {
    return (kelvin - 273.15).toFixed(1);
  };

  const kelvinToFahrenheit = (kelvin) => {
    return ((kelvin - 273.15) * 9/5 + 32).toFixed(1);
  };

  return (
    <div className="weather-app">
      <div className="container">
        <header>
          <h1>Weather Forecast</h1>
          <p className="subtitle">Get current weather information for any city</p>
        </header>

        <div className="search-section">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Enter city name..." 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={handleKeyPress}
              className="search-input"
            />
            <button 
              onClick={getWeather} 
              className="search-button"
              disabled={loading}
            >
              {loading ? "Searching..." : "Get Weather"}
            </button>
          </div>

          {recentSearches.length > 0 && (
            <div className="recent-searches">
              <h3>Recent Searches</h3>
              <div className="search-tags">
                {recentSearches.map((search, index) => (
                  <span 
                    key={index} 
                    className="search-tag"
                    onClick={() => searchFromRecent(search)}
                  >
                    {search}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && (
          <div className="loading-indicator">
            <div className="loader"></div>
            <p>Fetching weather data...</p>
          </div>
        )}

        {result && !loading && (
          <div className="weather-result">
            <div className="weather-header">
              <div className="weather-icon">
                {getWeatherIcon(result.weather)}
              </div>
              <div className="location-info">
                <h2>{result.name}</h2>
                <p className="weather-description">{result.weather}</p>
              </div>
            </div>
            
            <div className="weather-details">
              <div className="detail-item">
                <span className="detail-label">Temperature</span>
                <div className="temperature">
                  <span className="temp-value">{kelvinToCelsius(result.temp)}°C</span>
                  <span className="temp-fahrenheit">({kelvinToFahrenheit(result.temp)}°F)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <footer>
        <p>© {new Date().getFullYear()} Weather Forecast App</p>
      </footer>
    </div>
  );
}

export default App;