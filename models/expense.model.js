import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  userId: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  description: { type: String, trim: true },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
  createdBy: { type: String, trim: true },
  updatedBy: { type: String, trim: true },
}, { timestamps: true });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;


 