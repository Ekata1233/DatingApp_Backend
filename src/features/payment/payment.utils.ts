import axios from "axios";

const PAYU_OAUTH = "https://uat-accounts.payu.in/oauth/token";

export async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.PAYU_CLIENT_ID!,
    client_secret: process.env.PAYU_CLIENT_SECRET!,
    scope: "create_payment_links",
  });

  const { data } = await axios.post(PAYU_OAUTH, body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return data.access_token;
}