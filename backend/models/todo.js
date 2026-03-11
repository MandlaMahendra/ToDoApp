const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low"
  },
  dueDate: {
    type: Date
  },
  category: {
    type: String,
    default: "General"
  },
  description: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Todo", todoSchema);
