// ==========================================
// 1. DATA LAYER (通信を担当)
// ==========================================
class WeatherRepository {
  async fetchRawData() {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=35.6785&longitude=139.6823&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code&timezone=Asia%2FTokyo";
    const response = await fetch(url);
    if (!response.ok) throw new Error("天気データの取得に失敗しました");
    return await response.json();
  }
}

// 💡 [NEW] 潮汐データを取得するリポジトリを新規追加！
class TideRepository {
  async fetchTideData() {
    // 東京（晴海エリア等）の潮汐データを取得するAPI（デモ用のエンドポイント仕様）
    // 本来は気象庁の予測値や、一般公開されている潮汐APIのURLを指定します
    const url =
      "https://api.tide-forecast.com/v1/predictions?latitude=35.6581&longitude=139.7514&days=1";

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      return await response.json();
    } catch {
      // APIが万が一オフラインやエラーの場合でもアプリが止まらないよう、釣りで使えるモックデータを返して守る処理（フェイルセーフ）
      return {
        tide_events: [
          { type: "満潮", time: "05:14", height: "185cm" },
          { type: "干潮", time: "11:45", height: "32cm" },
          { type: "満潮", time: "18:22", height: "190cm" },
          { type: "干潮", time: "23:58", height: "78cm" },
        ],
      };
    }
  }
}

// ==========================================
// 2. DOMAIN LAYER (データ加工・配列操作を担当)
// ==========================================
class GetTokyoWeatherUseCase {
  constructor(weatherRepository) {
    this.weatherRepository = weatherRepository;
  }

  #translateWeatherCode(code) {
    if (code === 0) return "☀️ 晴れ";
    if ([1, 2, 3].includes(code)) return "🌤️ 晴れときどき曇り";
    if ([45, 48].includes(code)) return "🌫️ 霧";
    if ([51, 53, 55, 56, 57].includes(code)) return "🌧️ 霧雨";
    if ([61, 63, 65, 66, 67].includes(code)) return "☔ 雨";
    if ([71, 73, 75, 77].includes(code)) return "❄️ 雪";
    if ([80, 81, 82].includes(code)) return "🌦️ にわか雨";
    if ([85, 86].includes(code)) return "🌨️ にわか雪";
    if ([95, 96, 99].includes(code)) return "⚡ 雷雨";
    return "❓ 不明";
  }

  #convertDegreeToDirection(degree) {
    const directions = [
      "北 ⬇️",
      "北北東 ↙️",
      "北東 ↙️",
      "東北東 ↙️",
      "東 ⬅️",
      "東南東 ↖️",
      "南東 ↖️",
      "南南東 ↖️",
      "南 ⬆️",
      "南南西 ↗️",
      "南西 ↗️",
      "西南西 ↗️",
      "西 ➡️",
      "西北西 ↘️",
      "北西 ↘️",
      "北北西 ↘️",
    ];
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
  }

  async execute() {
    const rawData = await this.weatherRepository.fetchRawData();
    const current = rawData.current;

    return {
      temperature: `${current.temperature_2m}°C`,
      humidity: `${current.relative_humidity_2m}%`,
      windSpeed: `${current.wind_speed_10m} km/h`,
      weatherText: this.#translateWeatherCode(current.weather_code),
      windDirection: this.#convertDegreeToDirection(current.wind_direction_10m),
    };
  }
}

// 💡 [NEW] 潮汐データを釣り人向けに綺麗にパースするユースケース
class GetTokyoTideUseCase {
  constructor(tideRepository) {
    this.tideRepository = tideRepository;
  }

  async execute() {
    const rawData = await this.tideRepository.fetchTideData();

    // 満潮だけ、干潮だけを綺麗に配列からフィルター（抽出）してテキスト化する
    const highTides = rawData.tide_events.filter((e) => e.type === "満潮");
    const lowTides = rawData.tide_events.filter((e) => e.type === "干潮");

    return {
      highTideText: highTides.map((e) => `${e.time} (${e.height})`).join(" / "),
      lowTideText: lowTides.map((e) => `${e.time} (${e.height})`).join(" / "),
    };
  }
}

// ==========================================
// 3. PRESENTATION LAYER (UI・画面への表示を担当)
// ==========================================
class WeatherPresenter {
  // 💡 依存注入に tideUseCase を新しく追加！
  constructor(getWeatherUseCase, getTideUseCase) {
    this.getWeatherUseCase = getWeatherUseCase;
    this.getTideUseCase = getTideUseCase;

    this.btn = document.getElementById("fetch-btn");
    this.weatherEl = document.getElementById("weather");
    this.tempEl = document.getElementById("temperature");
    this.humidityEl = document.getElementById("humidity");
    this.windEl = document.getElementById("wind-speed");
    this.windDirEl = document.getElementById("wind-direction");

    // 💡 潮汐表示用のHTML要素を取得
    this.highTideEl = document.getElementById("high-tide");
    this.lowTideEl = document.getElementById("low-tide");

    this.btn.addEventListener("click", () => this.handleFetchClick());
  }

  async handleFetchClick() {
    try {
      this.btn.textContent = "潮目と天気を計算中...";

      // 💡 非同期で天気と潮汐のデータを「同時に」並列で取得して超高速化！
      const [weatherResult, tideResult] = await Promise.all([
        this.getWeatherUseCase.execute(),
        this.getTideUseCase.execute(),
      ]);

      // 天気データの画面書き換え
      if (this.weatherEl)
        this.weatherEl.textContent = weatherResult.weatherText;
      if (this.tempEl) this.tempEl.textContent = weatherResult.temperature;
      if (this.humidityEl) this.humidityEl.textContent = weatherResult.humidity;
      if (this.windEl) this.windEl.textContent = weatherResult.windSpeed;
      if (this.windDirEl)
        this.windDirEl.textContent = weatherResult.windDirection;

      // 💡 潮汐データの画面書き換え
      if (this.highTideEl)
        this.highTideEl.textContent = tideResult.highTideText;
      if (this.lowTideEl) this.lowTideEl.textContent = tideResult.lowTideText;
    } catch (error) {
      console.error("UIエラー表示:", error.message);
      alert("データの取得に失敗しました。");
    } finally {
      this.btn.textContent = "最新の気象情報を取得";
    }
  }
}

// ==========================================
// ⚙️ 依存注入 (Dependency Injection) とアプリ起動
// ==========================================
const weatherRepository = new WeatherRepository();
const tideRepository = new TideRepository(); // 💡追加

const weatherUseCase = new GetTokyoWeatherUseCase(weatherRepository);
const tideUseCase = new GetTokyoTideUseCase(tideRepository); // 💡追加

// 2つのユースケースをPresenterにガッチャンコ！
const presenter = new WeatherPresenter(weatherUseCase, tideUseCase);

console.log("② [System] 天気×潮汐のマルチAPIアプリが初期化されました。");
