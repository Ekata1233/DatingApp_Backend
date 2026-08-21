// import { chatService } from "../chat.service";

// export const getNewMatches = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const userId = (req as any).user.id;

//     const matches =
//       await chatService.getNewMatches(userId);

//     return res.status(200).json({
//       success: true,
//       data: matches,
//     });
//   } catch (error) {
//     console.error(
//       "getNewMatches error:",
//       error
//     );

//     return res.status(400).json({
//       success: false,
//       message:
//         error instanceof Error
//           ? error.message
//           : "Failed to get new matches",
//     });
//   }
// };