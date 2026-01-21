import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = "https://todoapp-jizo.onrender.com";

export default function Dashboard({ setAuth }) {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    const res = await fetch(API);
    const data = await res.json();
    setTodos(data);
  }

  async function addTodo() {
    if (!text.trim()) return;

    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    setText("");
    fetchTodos();
  }

  async function deleteTodo(id) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchTodos();
  }

  async function toggleTodo(id, completed) {
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition">

        {/* NAVBAR */}
        <nav className="flex justify-between items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
          <h1 className="text-2xl font-extrabold tracking-wide">
            🚀 TaskFlow
          </h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDark(!dark)}
              className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
            >
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>

            <button
              onClick={logout}
              className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* MAIN */}
        <main className="max-w-6xl mx-auto px-6 py-10">

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard
              title="Total Tasks"
              value={todos.length}
              gradient="from-blue-500 to-indigo-500"
            />
            <StatCard
              title="Completed"
              value={completed}
              gradient="from-green-500 to-emerald-500"
            />
            <StatCard
              title="Pending"
              value={pending}
              gradient="from-pink-500 to-rose-500"
            />
          </div>

          {/* INPUTS */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="✨ Add a new task..."
              className="flex-1 px-5 py-3 rounded-xl border-2 border-indigo-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={addTodo}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:scale-105 transition"
            >
              ➕ Add Task
            </button>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search..."
              className="px-5 py-3 rounded-xl border-2 border-pink-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none"
            />
          </div>

          {/* TODOS */}
          <AnimatePresence>
            <ul className="space-y-4">
              {filteredTodos.map((todo) => (
                <motion.li
                  key={todo._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex justify-between items-center p-5 rounded-xl bg-white dark:bg-gray-800 border-l-8 border-indigo-500 shadow-md hover:shadow-xl transition"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() =>
                        toggleTodo(todo._id, todo.completed)
                      }
                      className="w-5 h-5 accent-indigo-500"
                    />

                    <span
                      className={`text-lg font-medium ${
                        todo.completed
                          ? "line-through text-gray-400"
                          : "text-gray-800 dark:text-gray-100"
                      }`}
                    >
                      {todo.text}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteTodo(todo._id)}
                    className="text-red-500 hover:text-red-700 text-2xl font-bold"
                  >
                    ✕
                  </button>
                </motion.li>
              ))}
            </ul>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* COLORFUL STAT CARD */
function StatCard({ title, value, gradient }) {
  return (
    <div
      className={`p-6 rounded-2xl bg-gradient-to-r ${gradient} text-white shadow-lg hover:scale-105 transition`}
    >
      <p className="text-lg opacity-90 mb-2">{title}</p>
      <h3 className="text-4xl font-extrabold">{value}</h3>
    </div>
  );
}
