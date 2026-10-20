
"use client";

import { useEffect, useState } from "react";

type WeatherData = {
  city: string;
  date: string;
  sunrise: string | null;
  sunset: string | null;
  temperature: number;
  cloudCover: number | null;
  description: string;
  humidity: number;
  precipitationProbability: number;
  icon: string;
  hourlyTemperatures: {
    label: string;
    temperature: number | null;
  }[];
  availableDates: string[];
};

export default function Home() {

  const[city,setCity] = useState("名古屋")
  const[searchCity,setSearchCity] = useState("名古屋")
  const [date, setDate] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDate(new Date().toLocaleDateString("sv-SE"));
  }, []);

  useEffect(() => {
    if (!date || !city) return;

    const controller = new AbortController();

    async function getWeather() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/weather?city=${encodeURIComponent(city)}&date=${date}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "天気情報を取得できませんでした。");
        }

        setWeather(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
          setWeather(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    getWeather();

    return () => controller.abort();
  }, [city, date]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = searchCity.trim();

    if (value) {
      setCity(value);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-indigo-100 px-4 py-10 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <p className="mb-3 text-sm font-semibold tracking-[0.25em] text-sky-700">
            YOUR DAILY WEATHER
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            お天気ノート
          </h1>
          <p className="mt-4 text-slate-600">
            場所と日付を選んで、空の様子をチェックしよう。
          </p>
        </header>

        <section className="rounded-3xl border border-white bg-white/90 p-5 shadow-xl shadow-sky-900/5 sm:p-8">
          <form onSubmit={handleSearch} className="mb-7">
            <label
              htmlFor="city"
              className="mb-2 block text-sm font-semibold"
            >
              <span className="mr-2">📍</span>都市名
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="city"
                value={searchCity}
                onChange={(event) => setSearchCity(event.target.value)}
                placeholder="例：東京、大阪、名古屋"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
              <button
                type="submit"
                className="rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700"
              >
                天気を調べる
              </button>
            </div>
          </form>

          <div className="mb-7">
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-semibold"
            >
              <span className="mr-2">📅</span>予報の日付
            </label>
            <input
              id="date"
              type="date"
              value={date}
              min={weather?.availableDates[0]}
              max={weather?.availableDates[weather.availableDates.length - 1]}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:w-auto"
            />
            <p className="mt-2 text-xs text-slate-500">
              選べる日付は取得できた予報の範囲内です。
            </p>
          </div>

          {loading && (
            <div className="rounded-2xl bg-sky-50 px-4 py-10 text-center text-sky-700">
              <p className="text-2xl">☁️</p>
              <p className="mt-2 font-medium">空の様子を確認中...</p>
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700"
            >
              <p className="font-semibold">天気を取得できませんでした</p>
              <p className="mt-2 text-sm">{error}</p>
              <p className="mt-2 text-sm">
                都市名やAPIキーの設定を確認してみてね。
              </p>
            </div>
          )}

          {!loading && !error && weather && (
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-6 text-white sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-sky-100">WEATHER FORECAST</p>
                  <h2 className="mt-2 text-2xl font-bold">{weather.city}</h2>
                  <p className="mt-1 text-sm text-sky-100">{weather.date}</p>
                </div>
                <span className="text-6xl" aria-hidden="true">
                  {weather.icon}
                </span>
              </div>

              <div className="my-8">
                <p className="text-6xl font-bold tracking-tight">
                  {Math.round(weather.temperature)}°
                </p>
                <p className="mt-3 text-xl">{weather.description}</p>
              </div>

              <div className="mt-8 rounded-2xl bg-white/15 p-5">
  <h3 className="text-lg font-bold">👕 時間帯別の服装アドバイス</h3>
  <p className="mt-1 text-sm text-sky-100">
    気温の変化を見て、外出時の服装を考えよう。
  </p>

  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
    {weather.hourlyTemperatures.map((period) => (
      <div
        key={period.label}
        className="rounded-xl bg-white/15 p-4"
      >
        <p className="font-semibold">{period.label}</p>

        {period.temperature !== null ? (
          <>
            <p className="mt-2 text-3xl font-bold">
              {Math.round(period.temperature)}°
            </p>
            <p className="mt-2 text-sm">
              {period.temperature < 10
                ? "厚手の上着がおすすめ"
                : period.temperature < 17
                  ? "ジャケットやカーディガン"
                  : period.temperature < 24
                    ? "長袖や薄手の羽織りもの"
                    : "半袖など涼しい服装"}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-sky-100">
            この時間帯の予報はありません
          </p>
        )}
      </div>
    ))}
  </div>
</div>
<div className="mt-8 rounded-2xl bg-white/15 p-5">
  <h3 className="text-lg font-bold">🌙 夜空ガイド</h3>

  <p className="mt-2 text-sm text-sky-100">
    雲の量を参考に、月や星を眺める計画を立てよう。
  </p>

  <div className="mt-4 rounded-xl bg-white/15 p-4">
    <p className="font-semibold">☁️ 雲量の目安</p>
    <p className="mt-2 text-3xl font-bold">
    {weather.cloudCover !== null
  ? `${weather.cloudCover}%`
  : "夜の予報データがありません"}
    </p>

    <p className="mt-2 text-sm">
      {weather.cloudCover === null
  ? "夜の予報データがないため、観察の目安を表示できません。"
  : weather.cloudCover <= 25
    ? "雲が少なめ。星空観察に期待できそう！"
    : weather.cloudCover <= 60
      ? "雲が広がるかも。空の様子を確認してみよう。"
      : "雲が多め。月や星が見えにくい可能性があるよ。"}
    </p>
  </div>
  <div className="mt-8 rounded-2xl bg-white/15 p-5">
  <h3 className="text-lg font-bold">🌅 日の出・日の入り</h3>
  <p className="mt-2 text-sm text-sky-100">
    朝のスタートや夕方のお出かけの参考にしよう。
  </p>

  <div className="mt-4 grid grid-cols-2 gap-4">
    <div className="rounded-xl bg-white/15 p-4">
      <p className="text-sm">🌄 日の出</p>
      <p className="mt-2 text-2xl font-bold">
        {weather.sunrise ?? "取得できません"}
      </p>
    </div>

    <div className="rounded-xl bg-white/15 p-4">
      <p className="text-sm">🌇 日の入り</p>
      <p className="mt-2 text-2xl font-bold">
        {weather.sunset ?? "取得できません"}
      </p>
    </div>
  </div>
</div>

  <p className="mt-3 text-xs text-sky-100">
    ※現在の雲量は選択日の予報全体から計算した目安です。
    夜の空の状態と異なる場合があります。
  </p>
</div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/15 p-4">
                  <p className="text-sm text-sky-100">💧 湿度</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {weather.humidity}%
                  </p>
                </div>
                <div className="rounded-xl bg-white/15 p-4">
                  <p className="text-sm text-sky-100">☔ 降水確率</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {Math.round(weather.precipitationProbability)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !weather && (
            <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-slate-500">
              天気情報を準備しています。
            </div>
          )}
        </section>

        <footer className="mt-6 text-center text-xs text-slate-500">
          天気予報は参考情報です。お出かけ前に最新情報も確認してね。
        </footer>
      </div>
    </main>
  );
}
