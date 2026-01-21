import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = "https://todoapp-jizo.onrender.com/api/todos";

export default function Dashboard({ setAuth }) {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const res = await fetch(API, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      console.log("TODOS:", data);
      setTodos(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function addTodo() {
    if (!text.trim()) return;

    await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ text }),
    });

    setText("");
    fetchTodos();
  }

  async function deleteTodo(id) {
    await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    fetchTodos();
  }

  async function toggleTodo(id, completed) {
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ completed: !completed }),
    });
    fetchTodos();
  }

  function logout() {
    localStorage.removeItem("token");
    setAuth(false);
  }

  const filteredTodos = todos.filter((t) =>
    t.text.toLowerCase().includes(search.toLowerCase())
  );

  const completed = todos.filter((t) => t.completed).length;
  const pending = todos.length - completed;

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 transition">

        {/* NAVBAR */}
        <nav className="flex justify-between items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <h1 className="text-2xl font-extrabold">🚀 TaskFlow</h1>

          <div className="flex gap-4">
            <button onClick={() => setDark(!dark)}>
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button onClick={logout}>Logout</button>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex gap-4 mb-6">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add task..."
              className="flex-1 p-3 rounded"
            />
            <button onClick={addTodo}>Add</button>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="p-3 rounded"
            />
          </div>

          <p>Total: {todos.length} | Completed: {completed} | Pending: {pending}</p>

          <AnimatePresence>
            <ul className="mt-6 space-y-4">
              {filteredTodos.map((todo) => (
                <motion.li
                  key={todo._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-between p-4 bg-white dark:bg-gray-800 rounded"
                >
                  <label className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() =>
                        toggleTodo(todo._id, todo.completed)
                      }
                    />
                    {todo.text}
                  </label>

                  <button onClick={() => deleteTodo(todo._id)}>❌</button>
                </motion.li>
              ))}
            </ul>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
