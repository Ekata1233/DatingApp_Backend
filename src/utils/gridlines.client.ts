// services/gridlines.client.ts

import axios from "axios";

export const gridlinesClient = axios.create({
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": process.env.GRIDLINES_API_KEY!,
    "X-Auth-Type": "API-Key",
  },
});