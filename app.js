class WeatherService {
  async getCurrentWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia%2FTokyo`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("API通信エラー");
    return await response.json();
  }

  getWeatherDescription(code) {
    const descriptions = {
      0: "☀️ 晴れ",
      1: "🌤️ 晴れ",
      2: "⛅ 曇り",
      3: "☁️ 曇り",
      61: "☔ 雨",
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
    } catch (error) {
      alert("情報の取得に失敗しました");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => new WeatherApp());
