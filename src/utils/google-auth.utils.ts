import axios from "axios";

export const verifyGoogleToken = async (token: string) => {
  const response = await axios.get(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
  );

  return response.data;
};
