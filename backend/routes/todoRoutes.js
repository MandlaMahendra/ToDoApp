const express = require("express");
const Todo = require("../models/todo");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// GET all todos for current user
router.get("/", async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD a new todo
router.post("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check limit for free users
    if (user.subscriptionPlan === "free") {
      const todoCount = await Todo.countDocuments({ userId: req.user.id });
      if (todoCount >= 10) {
        return res.status(403).json({
          message: "Free limit reached. Upgrade to Pro for unlimited todos!",
          limitReached: true
        });
      }
    }

    const newTodo = new Todo({
      text: req.body.text,
      userId: req.user.id, // Associate todo with current user
      priority: req.body.priority,
      dueDate: req.body.dueDate,
      category: req.body.category,
      description: req.body.description
    });

    const savedTodo = await newTodo.save();
    res.json(savedTodo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a todo
router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!todo) return res.status(404).json({ message: "Todo not found or unauthorized" });
    res.json({ message: "Todo deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// UPDATE todo (toggle completed)
router.put("/:id", async (req, res) => {
  try {
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        text: req.body.text,
        completed: req.body.completed,
        priority: req.body.priority,
        dueDate: req.body.dueDate,
        category: req.body.category,
        description: req.body.description
      },
      { new: true }
    );
    if (!updatedTodo) return res.status(404).json({ message: "Todo not found or unauthorized" });
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
