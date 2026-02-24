// src/components/SafetyScore.jsx
import React, { useEffect, useState } from "react";
import { fetchCrimeIndex, fetchCrowdDensity, fetchWeatherRisk } from "../utils/safetyApis";

const computeSafetyScore = ({ crime, crowd, weather }) => {
  // weights (customizable)
  const wCrime = 0.5;
  const wCrowd = 0.3;
  const wWeather = 0.2;

  // Each input is 0..100 (100 = worst). Convert to safety contribution (higher -> worse).
  // We'll compute a risk score first (0 worst - 100 best) then invert to safety 0..100.
  const risk = (wCrime * crime) + (wCrowd * crowd) + (wWeather * weather); // 0..100
  const safety = Math.max(0, 100 - risk); // 0 (very unsafe) .. 100 (very safe)
  return { risk: Math.round(risk), safety: Math.round(safety) };
};

const SafetyScore = ({ lat = 12.9719, lon = 77.5946 }) => {
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState(null);
  const [score, setScore] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [crime, crowd, weather] = await Promise.all([
          fetchCrimeIndex(lat, lon),
          fetchCrowdDensity(lat, lon),
          fetchWeatherRisk(lat, lon)
        ]);
        if (!mounted) return;

        const calc = computeSafetyScore({ crime, crowd, weather });
        setSignals({ crime, crowd, weather });
        setScore(calc);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [lat, lon]);

  if (loading) return <div>Calculating safety score…</div>;
  if (!signals || !score) return <div>Unable to compute safety right now.</div>;

  const badgeColor = score.safety > 70 ? "green" : score.safety > 40 ? "orange" : "red";

  return (
    <div className="safety-score-card">
      <h3>Area Safety Score</h3>
      <div style={{ fontSize: 28, fontWeight: "700", color: badgeColor }}>
        {score.safety} / 100
      </div>

      <ul>
        <li>Crime index: {signals.crime} / 100</li>
        <li>Crowd density: {signals.crowd} / 100</li>
        <li>Weather risk: {signals.weather} / 100</li>
        <li>Composite risk: {score.risk} / 100</li>
      </ul>

      <p>
        Recommendation: {score.safety > 70 ? "Safe to proceed" : score.safety > 40 ? "Exercise caution" : "Avoid area / seek safe zone"}
      </p>
    </div>
  );
};

export default SafetyScore;
