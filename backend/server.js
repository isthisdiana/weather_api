const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "weather_api",
});

// Connect to the database
db.connect((err) => {
  if (err) console.error("DB Error:", err);
  else console.log("Connected to MySQL");
});

// Main weather endpoint
app.post("/api/weather", async (req, res) => {
  const { city } = req.body;
  
  if (!city || city.trim() === '') {
    return res.status(400).json({ message: "City name is required" });
  }
  
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`
    );
    
    const { name, weather, main, sys, wind, clouds } = response.data;
    
    // Save basic info to the database
    const sql = "INSERT INTO weather_logs (city, description, temperature) VALUES (?, ?, ?)";
    
    db.query(sql, [name, weather[0].description, main.temp], (err) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database error occurred" });
      }
      
      // Return more detailed weather information to the client
      res.json({
        name,
        country: sys.country,
        weather: weather[0].description,
        main: weather[0].main,
        temp: main.temp,
        feels_like: main.feels_like,
        humidity: main.humidity,
        pressure: main.pressure,
        wind_speed: wind.speed,
        clouds: clouds.all,
        timestamp: new Date()
      });
    });
    
  } catch (error) {
    if (error.response) {
      // OpenWeather API error response
      res.status(error.response.status).json({ 
        message: error.response.data.message || "Weather service error" 
      });
    } else if (error.request) {
      // No response received
      res.status(503).json({ message: "Weather service unavailable" });
    } else {
      // Other errors
      console.error("Server error:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  }
});

// Get recent searches endpoint
app.get("/api/recent", (req, res) => {
  const sql = "SELECT city, description, temperature, timestamp FROM weather_logs ORDER BY timestamp DESC LIMIT 10";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Could not fetch recent searches" });
    }
    
    res.json(results);
  });
});

// Server health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Running on http://localhost:${PORT}`));