import axios from "axios";

interface SendEmailOptions {
  email: string;
  name?: string;
  templateId: string;
  variables: Record<string, string>;
}

export const sendMSG91Email = async ({
  email,
  name,
  templateId,
  variables,
}: SendEmailOptions) => {
  const authkey = process.env.MSG91_EMAIL_AUTH_KEY;
  const domain = process.env.MSG91_EMAIL_DOMAIN;
  const fromEmail = process.env.MSG91_EMAIL_FROM;

  if (!authkey || !domain || !fromEmail) {
    throw new Error("MSG91 email configuration is missing");
  }

  try {
    const { data } = await axios.post(
      "https://control.msg91.com/api/v5/email/send",
      {
        recipients: [
          {
            to: [
              {
                email,
                name: name || email,
              },
            ],
            variables,
          },
        ],
        from: {
          name: process.env.MSG91_EMAIL_FROM_NAME || "Welvors",
          email: fromEmail,
        },
        domain,
        template_id: templateId,
      },
      {
        headers: {
          accept: "application/json",
          authkey,
          "content-type": "application/json",
        },
        timeout: 15000,
      }
    );

    if (data.hasError || data.status !== "success") {
      throw new Error("MSG91 rejected the email request");
    }

    return {
      success: true,
      requestId: data.data?.unique_id,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("MSG91 Email Error:", {
        status: error.response?.status,
        apiError: error.response?.data?.apiError,
      });
    }

    throw new Error("Failed to send email");
  }
};

/* -------------------------------------------------------------------------- */
/*                              SEND EMAIL OTP                                */
/* -------------------------------------------------------------------------- */

export const sendMSG91EmailOtp = async (
  email: string,
  otp: string
) => {
  const templateId =
    process.env.MSG91_EMAIL_OTP_TEMPLATE_ID;

  if (!templateId) {
    throw new Error("MSG91 OTP template is missing");
  }

  return sendMSG91Email({
    email,
    templateId,
    variables: {
      otp,
    },
  });
};