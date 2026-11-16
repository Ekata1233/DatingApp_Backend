// import axios from "axios";

// export const verifyGoogleToken = async (token: string) => {
//   const response = await axios.get(
//     `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
//   );

//   return response.data;
// };


import axios from "axios";

export const verifyGoogleToken = async (idToken: string) => {
  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    return response.data;
  } catch (error: any) {
    throw new Error("Invalid Google Token");
  }
};

