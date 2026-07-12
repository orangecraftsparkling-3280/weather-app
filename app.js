class WeatherService {
  async getCurrentWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=Asia%2FTokyo`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("API通信エラー");
    return await response.json();
  }

  getWeatherDescription(code) {
    const descriptions = {

      0: "☀️ 快晴",
      1: "🌤️ 晴れ",
      2: "⛅ 晴れ時々曇り",
      3: "☁️ 曇り",
      45: "🌫️ 霧",
      48: "🌫️ 霧（霧氷）",
      51: "🌦️ 小雨",
      53: "🌧️ 雨",
      55: "🌧️ 強い雨",
      61: "🌦️ 小雨",
      63: "🌧️ 雨",
      65: "🌧️ 激しい雨",
      71: "❄️ 小雪",
      73: "❄️ 雪",
      75: "❄️ 大雪",
      80: "🌦️ にわか雨",
      81: "🌧️ にわか雨",
      82: "⛈️ 激しいにわか雨",
      95: "⛈️ 雷雨",
    };
    return descriptions[code] || "☁️ 気象情報";
  }
}

class WeatherApp {
  constructor() {
    this.service = new WeatherService();
    this.select = document.getElementById("location-select");
    this.btn = document.getElementById("fetch-btn");

    this.init();
    this.btn.addEventListener("click", () => this.update());
  }

  init() {
    JAPAN_LOCATIONS.forEach((loc) => {
      const opt = document.createElement("option");
      opt.value = `${loc.lat},${loc.lon}`;
      opt.textContent = loc.name;
      this.select.appendChild(opt);
    });
  }

  async update() {
    const [lat, lon] = this.select.value.split(",");
    try {
      const data = await this.service.getCurrentWeather(lat, lon);
      document.getElementById("weather").textContent =
        this.service.getWeatherDescription(data.current.weather_code);
      document.getElementById("temperature").textContent =
        `${data.current.temperature_2m}°C`;
      document.getElementById("humidity").textContent =
        `${data.current.relative_humidity_2m}%`;
      document.getElementById("apparent-temp").textContent =
        `${data.current.apparent_temperature}°C`;
      document.getElementById("wind-speed").textContent =
        `${data.current.wind_speed_10m} km/h`;
    } catch (error) {
      alert("情報の取得に失敗しました");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => new WeatherApp());
