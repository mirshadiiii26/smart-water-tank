Next
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Smart Water Tank backend is running!");
});

app.get("/api/status", async (req, res) => {
  const token = process.env.BLYNK_AUTH_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "Blynk token is not configured"
    });
  }

  try {
    async function getPin(pin) {
      const url =
        `https://blynk.cloud/external/api/get?token=${encodeURIComponent(token)}&${pin}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Blynk request failed for ${pin}`);
      }

      const text = await response.text();

      try {
        const value = JSON.parse(text);
        return Array.isArray(value) ? value[0] : value;
      } catch {
        return text;
      }
    }

    const [distance, pump, water, low, high, auto] =
      await Promise.all([
        getPin("V0"),
        getPin("V1"),
        getPin("V2"),
        getPin("V3"),
        getPin("V4"),
        getPin("V5")
      ]);

    const distanceCm = Number(distance);

    res.json({
      distanceCm: Number.isFinite(distanceCm)
        ? distanceCm
        : null,
      waterLevelPercent: null,
      pumpOn: Number(pump) === 1,
      waterStatus: String(water),
      lowFloat: Number(low),
      highFloat: Number(high),
      autoMode: Number(auto) === 1
    });
  } catch (error) {
    res.status(502).json({
      error: "Could not retrieve data from Blynk"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
