import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import vehicleRoutes from "./routes/vehicle.routes.js"; // ✅ Import your route
import driverRoutes from "./routes/driver.routes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:4200",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Base route
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

// ✅ Use vehicle routes
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
