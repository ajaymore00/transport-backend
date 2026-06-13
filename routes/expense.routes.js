import express from "express";
import Expense from "../models/expense.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET all expenses for authenticated user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.userId });
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET expense by ID for authenticated user
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.status(200).json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// CREATE a new expense
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      type,
      amount,
      date,
      description,
      createdDate,
      updatedDate,
      createdOn,
      updatedOn,
      createdBy,
      updatedBy,
    } = req.body;

    if (!type || amount === undefined || !date) {
      return res.status(400).json({ message: "Missing required expense fields" });
    }

    const expense = new Expense({
      userId: req.user.userId,
      type,
      amount,
      date,
      description,
      createdDate,
      updatedDate,
      createdOn: createdOn || new Date(),
      updatedOn: updatedOn || new Date(),
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
    });

    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// UPDATE an expense by ID
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedDate: req.body.updatedDate || new Date(),
      updatedOn: req.body.updatedOn || new Date(),
      updatedBy: req.user.userId,
    };

    const updatedExpense = await Expense.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedExpense) return res.status(404).json({ message: "Expense not found" });
    res.status(200).json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE an expense by ID
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedExpense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!deletedExpense) return res.status(404).json({ message: "Expense not found" });
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
