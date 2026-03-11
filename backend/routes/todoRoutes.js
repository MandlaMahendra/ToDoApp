const express = require("express");
const Todo = require("../models/todo");

const router = express.Router();

// GET all todos
router.get("/", async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD a new todo
router.post("/", async (req, res) => {
  try {
    const newTodo = new Todo({
      text: req.body.text,
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
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: "Todo deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// UPDATE todo (toggle completed)
router.put("/:id", async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
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
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
