
import { NextRequest, NextResponse } from "next/server";

const WEATHER_URL = "https://api.openweathermap.org/data/2.5/forecast";

function getWeatherEmoji(main: string): string {
  switch (main.toLowerCase()) {
    case "clear":
      return "☀️";
    case "clouds":
      return "☁️";
    case "rain":
      return "🌧️";
    case "drizzle":
      return "🌦️";
    case "thunderstorm":
      return "⛈️";
    case "snow":
      return "❄️";
    case "mist":
    case "fog":
    case "haze":
      return "🌫️";
    default:
      return "🌤️";
  }
}
const cityNameMap: Record<string, string> = {
  "名古屋": "Nagoya",
  "東京": "Tokyo",
  "大阪": "Osaka",
  "京都": "Kyoto",
  "横浜": "Yokohama",
  "札幌": "Sapporo",
  "福岡": "Fukuoka",
  "神戸": "Kobe",
  "仙台": "Sendai",
  "広島": "Hiroshima",
};
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "APIキーが設定されていません。.env.localを確認してください。" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city")?.trim();
    const date = searchParams.get("date");

    if (!city || !date) {
      return NextResponse.json(
        { error: "都市名と日付を指定してください。" },
        { status: 400 }
      );
    }

    const geoUrl = new URL(
      "https://api.openweathermap.org/geo/1.0/direct"
    );
    const searchCity = cityNameMap[city.trim()] ?? city.trim();
    geoUrl.searchParams.set("q", searchCity);
    geoUrl.searchParams.set("limit", "1");
    geoUrl.searchParams.set("appid", apiKey);

    const geoResponse = await fetch(geoUrl.toString(), {
      cache: "no-store",
    });

    if (!geoResponse.ok) {
      return NextResponse.json(
        { error: "都市の検索に失敗しました。APIキーを確認してください。" },
        { status: geoResponse.status }
      );
    }

    const locations = await geoResponse.json();

    if (!locations.length) {
      return NextResponse.json(
        { error: "都市が見つかりません。都市名を確認して再度お試しください。" },
        { status: 404 }
      );
    }

    const { lat, lon, name, country } = locations[0];

    const forecastUrl = new URL(WEATHER_URL);
    forecastUrl.searchParams.set("lat", String(lat));
    forecastUrl.searchParams.set("lon", String(lon));
    forecastUrl.searchParams.set("appid", apiKey);
    forecastUrl.searchParams.set("units", "metric");
    forecastUrl.searchParams.set("lang", "ja");

    const forecastResponse = await fetch(forecastUrl.toString(), {
      cache: "no-store",
    });

    if (!forecastResponse.ok) {
      return NextResponse.json(
        { error: "天気予報を取得できません。時間をおいて再度お試しください。" },
        { status: forecastResponse.status }
      );
    }

    const forecast = await forecastResponse.json();
    const sunUrl = new URL("https://api.sunrise-sunset.org/json");
sunUrl.searchParams.set("lat", String(lat));
sunUrl.searchParams.set("lng", String(lon));
sunUrl.searchParams.set("date", date);
sunUrl.searchParams.set("formatted", "0");

const sunResponse = await fetch(sunUrl.toString(), {
  cache: "no-store",
});

const sunData = sunResponse.ok
  ? await sunResponse.json()
  : null;
  const sunrise = sunData?.results?.sunrise
  ? new Date(sunData.results.sunrise).toLocaleTimeString("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  : null;

const sunset = sunData?.results?.sunset
  ? new Date(sunData.results.sunset).toLocaleTimeString("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  : null;
    const entries = forecast.list.filter((item: {
      dt_txt: string;
    }) => item.dt_txt.startsWith(date));

    if (!entries.length) {
      return NextResponse.json(
        { error: "この日付の予報データがありません。予報期間内の日付を選んでください。" },
        { status: 404 }
      );
    }

    const average = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;

    const temperatures = entries.map((item: {
      main: { temp: number };
    }) => item.main.temp);

    const humidities = entries.map((item: {
      main: { humidity: number };
    }) => item.main.humidity);

    const precipitation = entries.map((item: {
      pop: number;
    }) => item.pop * 100);

    const representative = entries[Math.floor(entries.length / 2)];
    const nightEntries = entries.filter((item: {
      dt_txt: string;
      clouds: { all: number };
    }) => {
      const hour = Number(item.dt_txt.slice(11, 13));
      return hour >= 18 || hour < 5;
    });
    
    const cloudCover = nightEntries.length
      ? Math.round(
          nightEntries.reduce(
            (sum: number, item: { clouds: { all: number } }) =>
              sum + item.clouds.all,
            0
          ) / nightEntries.length
        )
      : null;
    const timePeriods = [
      { label: "朝", start: 5, end: 10 },
      { label: "昼", start: 11, end: 15 },
      { label: "夕方", start: 16, end: 19 },
    ];
    
    const hourlyTemperatures = timePeriods.map((period) => {
      const periodEntries = entries.filter((item: {
        dt_txt: string;
        main: { temp: number };
      }) => {
        const hour = Number(item.dt_txt.slice(11, 13));
        return hour >= period.start && hour < period.end;
      });
    
      return {
        label: period.label,
        temperature: periodEntries.length
          ? average(periodEntries.map((item: {
              main: { temp: number };
            }) => item.main.temp))
          : null,
      };
    });

    return NextResponse.json({
      city: city.trim(),
      date,
      sunrise,
      sunset,
      temperature: average(temperatures),
      cloudCover,
      description: representative.weather[0].description,
      humidity: Math.round(average(humidities)),
      precipitationProbability: Math.round(Math.max(...precipitation)),
      icon: getWeatherEmoji(representative.weather[0].main),
      hourlyTemperatures,
      availableDates: [
        ...new Set(
          forecast.list.map((item: { dt_txt: string }) =>
            item.dt_txt.slice(0, 10)
          )
        ),
      ],
    });
  } catch {
    return NextResponse.json(
      { error: "通信中に問題が起きました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
