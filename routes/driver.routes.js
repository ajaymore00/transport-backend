import express from "express";
import Driver from "../models/driver.model.js";
import User from "../models/user.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Helper function to generate username from driver name
const generateUsername = (driverName) => {
  return driverName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");
};

// Helper function to generate password from contact number
const generatePassword = (contact) => {
  const cleanContact = contact.replace(/\D/g, "").slice(-10);
  const firstSix = cleanContact.substring(0, 6);
  const lastTwo = cleanContact.substring(8, 10);
  return `Pass@${firstSix}${lastTwo}`;
};

// Helper function to create driver user
const createDriverUser = async (driver, parentUser) => {
  const username = generateUsername(driver.name);
  const password = generatePassword(driver.contact);

  const driverUser = new User({
    transporterName: parentUser.transporterName || "Driver Account",
    ownerName: driver.name,
    whatsappNumber: driver.contact,
    email: `${username}@transport.local`,
    userName: username,
    mobileNumber: driver.contact,
    password,
    userId: driver.userId,
    roleId: 2,
    isVerified: true,
  });

  await driverUser.save();
  return { username, password, mobileNo: driver.contact };
};

// GET all drivers for authenticated user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const drivers = await Driver.find({ userId: req.user.userId });
    res.status(200).json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET driver by ID for authenticated user
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.status(200).json(driver);
  } catch (error) {
    console.error("Error fetching driver:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// CREATE a new driver
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      licenseNo,
      contact,
      experience,
      address,
      salary,
      joiningDate,
      dateAdded,
      status,
      createdDate,
      updatedDate,
      createdOn,
      updatedOn,
      createdBy,
      updatedBy,
    } = req.body;

    if (!name || !licenseNo || !contact) {
      return res.status(400).json({ message: "Missing required driver fields" });
    }

    const existingDriver = await Driver.findOne({ licenseNo });
    if (existingDriver) {
      return res.status(409).json({ message: "Driver with this license number already exists" });
    }

    const driver = new Driver({
      userId: req.user.userId,
      name,
      licenseNo,
      contact,
      experience,
      address,
      salary,
      joiningDate,
      dateAdded,
      status,
      createdDate,
      updatedDate,
      createdOn: createdOn || new Date(),
      updatedOn: updatedOn || new Date(),
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
    });

    const savedDriver = await driver.save();

    // Auto-create user for driver
    const credentials = await createDriverUser(savedDriver, req.user);

    res.status(201).json({
      ...savedDriver.toObject(),
      driverCredentials: {
        username: credentials.contact,
        password: credentials.contact,
        mobileNo: credentials.contact,
        roleId: 2,
      },
    });
  } catch (error) {
    console.error("Error creating driver:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// UPDATE a driver by ID
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedDate: req.body.updatedDate || new Date(),
      updatedOn: req.body.updatedOn || new Date(),
      updatedBy: req.user.userId,
    };

    const updatedDriver = await Driver.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedDriver) return res.status(404).json({ message: "Driver not found" });
    res.status(200).json(updatedDriver);
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE a driver by ID
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedDriver = await Driver.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!deletedDriver) return res.status(404).json({ message: "Driver not found" });

    // Auto-delete associated user
    await User.findOneAndDelete({ userId: deletedDriver.userId, roleId: 2 });

    res.status(200).json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
