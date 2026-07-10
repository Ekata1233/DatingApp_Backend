import { Request, Response } from "express";
import { applyReferral, getReferralDashboard, validateReferralCode } from "./referral.service";

export const validateReferralController = async (
  req: Request,
  res: Response
) => {
  try {

    const userId = (req as any).user.id;

    const { referralCode } = req.body;

    const result = await validateReferralCode(
      userId,
      referralCode
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });

  }
};

export const applyReferralController = async(
req:Request,
res:Response
)=>{

try{

const {referralCode}=req.body;

const result=await applyReferral(
(req as any).user.id,
referralCode
);

return res.status(200).json(result);

}catch(error:any){

return res.status(400).json({
success:false,
message:error.message
});

}

}

export const referralDashboardController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const data = await getReferralDashboard(
      userId,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      message: "Referral dashboard fetched successfully.",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};