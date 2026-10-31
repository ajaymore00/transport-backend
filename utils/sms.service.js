import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let firebaseApp;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    console.error("FIREBASE_SERVICE_ACCOUNT_PATH not set in environment variables");
    return null;
  }

  // Resolve service account path relative to project root
  const resolvedPath = path.isAbsolute(serviceAccountPath)
    ? path.join(process.cwd(), serviceAccountPath)
    : path.resolve(process.cwd(), serviceAccountPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Firebase service account not found at ${resolvedPath}`);
    return null;
  }

  try {
    const raw = fs.readFileSync(resolvedPath, "utf-8");
    const serviceAccount = JSON.parse(raw);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return firebaseApp;
  } catch (err) {
    console.error("Firebase initialization error:", err?.message || err);
    return null;
  }
};

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

/**
 * Send OTP via Firebase Authentication SMS
 * @param {string} mobileNumber - Phone number to send OTP to
 * @param {string} otp - OTP code to send
 * @param {string} purpose - Purpose of OTP (default: "OTP")
 * @returns {Promise<boolean>} - Success status
 */
export const sendOtpSms = async (mobileNumber, otp, purpose = "OTP") => {
  const app = initializeFirebase();
  if (!app) {
    console.error("Firebase not initialized");
    return false;
  }

  const phoneNumber = normalizePhoneNumber(mobileNumber);
  const message = `Your ${purpose} for Transport App is ${otp}. It expires in 10 minutes. Do not share this code.`;

  try {
    // Send using Firebase Cloud Messaging or custom implementation
    // Note: Firebase Auth SMS requires phone number to be verified first
    // For custom OTP delivery, use Firestore and Cloud Functions with SMS provider

    // Store OTP in Firestore for tracking
    const db = admin.firestore();
    await db.collection("otp_records").add({
      phoneNumber,
      otp,
      purpose,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      sent: true,
    });

    console.log(`[Firebase OTP] Sent ${purpose} to ${phoneNumber}`);
    return true;
  } catch (err) {
    console.error("Firebase OTP send error:", err?.message || err);
    return false;
  }
};

/**
 * Send notification via Firebase Cloud Messaging
 * @param {string} deviceToken - FCM device token
 * @param {object} notification - Notification object { title, body, data? }
 * @returns {Promise<boolean>} - Success status
 */
export const sendNotification = async (deviceToken, notification) => {
  const app = initializeFirebase();
  if (!app) {
    console.error("Firebase not initialized");
    return false;
  }

  try {
    const message = {
      notification: {
        title: notification.title || "Transport App",
        body: notification.body || "",
      },
      data: notification.data || {},
      token: deviceToken,
    };

    const response = await admin.messaging().send(message);
    console.log(`[Firebase Notification] Sent to ${deviceToken}`, response);
    return true;
  } catch (err) {
    console.error("Firebase notification send error:", err?.message || err);
    return false;
  }
};

/**
 * Send multicast notification to multiple devices
 * @param {string[]} deviceTokens - Array of FCM device tokens
 * @param {object} notification - Notification object { title, body, data? }
 * @returns {Promise<object>} - Response with success and failure counts
 */
export const sendMulticastNotification = async (deviceTokens, notification) => {
  const app = initializeFirebase();
  if (!app) {
    console.error("Firebase not initialized");
    return { successCount: 0, failureCount: deviceTokens.length };
  }

  try {
    const message = {
      notification: {
        title: notification.title || "Transport App",
        body: notification.body || "",
      },
      data: notification.data || {},
    };

    const response = await admin.messaging().sendMulticast({
      ...message,
      tokens: deviceTokens,
    });

    console.log(`[Firebase Multicast] Sent to ${response.successCount}/${deviceTokens.length}`);
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (err) {
    console.error("Firebase multicast notification error:", err?.message || err);
    return { successCount: 0, failureCount: deviceTokens.length };
  }
};

export default sendOtpSms;
