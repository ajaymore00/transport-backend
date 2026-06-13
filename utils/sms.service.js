import twilio from "twilio";

const normalizePhoneNumber = (mobileNumber) => {
  let number = String(mobileNumber || "").trim();
  number = number.replace(/[^0-9+]/g, "");
  if (!number.startsWith("+")) {
    if (/^\d{10}$/.test(number)) {
      number = `+91${number}`;
    } else {
      number = `+${number}`;
    }
  }
  return number;
};

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !fromNumber) return null;
  return { client: twilio(accountSid, authToken), fromNumber };
};

const sendViaTwilio = async (mobileNumber, message) => {
  const cfg = getTwilioClient();
  if (!cfg) return false;
  const { client, fromNumber } = cfg;
  const to = normalizePhoneNumber(mobileNumber);
  try {
    await client.messages.create({ body: message, from: fromNumber, to });
    return true;
  } catch (err) {
    console.error("Twilio send error:", err?.message || err);
    return false;
  }
};

// Textbelt: free tier available but limited. Provide TEXTBELT_KEY in env for paid key.
const sendViaTextbelt = async (mobileNumber, message) => {
  try {
    const to = normalizePhoneNumber(mobileNumber).replace(/^\+/, "");
    const params = new URLSearchParams();
    params.append("phone", to);
    params.append("message", message);
    params.append("key", process.env.TEXTBELT_KEY || "textbelt");

    const resp = await fetch("https://textbelt.com/text", {
      method: "POST",
      body: params,
    });
    const json = await resp.json();
    if (json.success) return true;
    console.warn("Textbelt response:", json);
    return false;
  } catch (err) {
    console.error("Textbelt send error:", err?.message || err);
    return false;
  }
};

const sendViaMock = async (mobileNumber, message) => {
  console.log("[sms-mock] to:", mobileNumber, "message:", message.replace(/\d{4,}/g, "****"));
  return true;
};

export const sendOtpSms = async (mobileNumber, otp, purpose = "OTP") => {
  const provider = (process.env.SMS_PROVIDER || "auto").toLowerCase();
  const message = `Your ${purpose} for Transport App is ${otp}. It expires in 10 minutes. Do not share this code.`;

  if (provider === "mock") return sendViaMock(mobileNumber, message);
  if (provider === "textbelt") return sendViaTextbelt(mobileNumber, message);
  if (provider === "twilio") return sendViaTwilio(mobileNumber, message);

  // auto: prefer Twilio if configured, otherwise try Textbelt, otherwise mock (development)
  const twCfg = getTwilioClient();
  if (twCfg) return sendViaTwilio(mobileNumber, message);
  // try textbelt next
  const tbOk = await sendViaTextbelt(mobileNumber, message);
  if (tbOk) return true;

  // fallback to mock in absence of real providers
  return sendViaMock(mobileNumber, message);
};

export default sendOtpSms;
