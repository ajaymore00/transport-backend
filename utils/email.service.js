import { BrevoClient } from "@getbrevo/brevo";

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

export const sendOtpEmail = async (email, otp, purpose = "verification") => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    throw new Error("BREVO_API_KEY and BREVO_SENDER_EMAIL must be configured");
  }

  const safePurpose = escapeHtml(purpose);
  const safeOtp = escapeHtml(otp);
  const client = new BrevoClient({ apiKey });

  try {
    await client.transactionalEmails.sendTransacEmail({
      sender: { email: senderEmail, name: "Transport App" },
      to: [{ email }],
      subject: `Your Transport App ${purpose} code`,
      textContent: `Your Transport App ${purpose} code is ${otp}. It expires in 10 minutes. Do not share this code.`,
      htmlContent: `<p>Your Transport App ${safePurpose} code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${safeOtp}</p><p>It expires in 10 minutes. Do not share this code.</p>`,
    });
  } catch (error) {
    console.error("Brevo OTP email error:", error?.message || error);
    throw new Error("Unable to deliver OTP email");
  }
};
