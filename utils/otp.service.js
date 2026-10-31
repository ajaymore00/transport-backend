import { createHash, randomInt, timingSafeEqual } from "crypto";

export const generateOTP = () => String(randomInt(100000, 1000000));

export const hashOTP = (otp) =>
  createHash("sha256").update(String(otp)).digest("hex");

export const verifyOTP = (otp, hashedOTP) => {
  if (!/^\d{6}$/.test(String(otp)) || !hashedOTP) return false;

  const candidateHash = Buffer.from(hashOTP(otp), "hex");
  const storedHash = Buffer.from(hashedOTP, "hex");
  return candidateHash.length === storedHash.length && timingSafeEqual(candidateHash, storedHash);
};
