// import { Request, Response } from "express";
// import { giftUnlockRuleService } from "./giftUnlockRule.service";

// export const getGiftUnlockRulesController = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const data =
//       await giftUnlockRuleService.getRules();

//     return res.status(200).json({
//       success: true,
//       data,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const createGiftUnlockRuleController = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const data =
//       await giftUnlockRuleService.createRule(
//         req.body,
//       );

//     return res.status(201).json({
//       success: true,
//       message:
//         "Gift unlock rule created successfully",
//       data,
//     });
//   } catch (error: any) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const updateGiftUnlockRuleController = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const { id } = req.params;

//     const data =
//       await giftUnlockRuleService.updateRule(
//         id,
//         req.body,
//       );

//     return res.status(200).json({
//       success: true,
//       message:
//         "Gift unlock rule updated successfully",
//       data,
//     });
//   } catch (error: any) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };