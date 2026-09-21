import axios from "axios";

const apiKey = process.env.GRIDLINES_API_KEY;

if (!apiKey) {
  throw new Error("GRIDLINES_API_KEY is missing");
}

export const gridlinesClient = axios.create({
  baseURL:
    process.env.GRIDLINES_BASE_URL ||
    "https://api.gridlines.io",

  timeout: 30000,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
    "X-Auth-Type": "API-Key",
  },
});