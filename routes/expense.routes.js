import express from "express";
import Expense from "../models/expense.model.js";

const router = express.Router();

// GET all expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET expense by ID
router.get("/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.status(200).json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// CREATE a new expense
router.post("/", async (req, res) => {
  try {
    const {
      type,
      amount,
      date,
      description,
      createdDate,
      updatedDate,
      createdBy,
      updatedBy,
    } = req.body;

    if (!type || amount === undefined || !date) {
      return res.status(400).json({ message: "Missing required expense fields" });
    }

    const expense = new Expense({
      type,
      amount,
      date,
      description,
      createdDate,
      updatedDate,
      createdBy,
      updatedBy,
    });

    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// UPDATE an expense by ID
router.put("/:id", async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedDate: req.body.updatedDate || new Date(),
    };

    const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, updateData, {
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
router.delete("/:id", async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
    if (!deletedExpense) return res.status(404).json({ message: "Expense not found" });
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
