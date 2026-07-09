// import { prisma } from "../config/prisma";

// const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// export const generateReferralCode = async (): Promise<string> => {
//   while (true) {
//     let code = "";

//     for (let i = 0; i < 8; i++) {
//       code += CHARACTERS.charAt(
//         Math.floor(Math.random() * CHARACTERS.length)
//       );
//     }

//     const exists = await prisma.user.findUnique({
//       where: {
//         referralCode: code,
//       },
//     });

//     if (!exists) {
//       return code;
//     }
//   }
// };