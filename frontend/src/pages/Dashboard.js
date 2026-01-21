import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = "https://todoapp-jizo.onrender.com/api/todos";

export default function Dashboard({ setAuth }) {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      setLoading(true);
      const res = await fetch(API);
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  async function toggleTodo(id, completed) {
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    fetchTodos();
  }

  async function deleteTodo(id) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-950 dark:to-gray-900 transition-all">

        {/* NAVBAR */}
        <nav className="flex justify-between items-center px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl">
          <h1 className="text-3xl font-extrabold tracking-wider">
            ⚡ TaskFlow Pro
          </h1>

          <div className="flex gap-4">
            <button
              onClick={() => setDark(!dark)}
              className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30"
            >
              {dark ? "☀ Light" : "🌙 Dark"}
            </button>

            <button
              onClick={logout}
              className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* CONTENT */}
        <main className="max-w-7xl mx-auto px-6 py-10">

          {/* STATS */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <Stat title="Total Tasks" value={todos.length} color="from-blue-500 to-indigo-500" />
            <Stat title="Completed" value={completed} color="from-green-500 to-emerald-500" />
            <Stat title="Pending" value={pending} color="from-pink-500 to-rose-500" />
          </div>

          {/* INPUT */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a powerful task..."
              className="flex-1 px-6 py-4 rounded-xl bg-white dark:bg-gray-800 border focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={addTodo}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold hover:scale-105 transition"
            >
              ➕ Add Task
            </button>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="px-6 py-4 rounded-xl bg-white dark:bg-gray-800 border"
            />
          </div>

          {/* TODOS */}
          {loading ? (
            <p className="text-center text-xl text-gray-500">Loading...</p>
          ) : (
            <AnimatePresence>
              <ul className="space-y-4">
                {filteredTodos.map((todo) => (
                  <motion.li
                    key={todo._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex justify-between items-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-l-8 border-indigo-500"
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo._id, todo.completed)}
                        className="w-5 h-5 accent-indigo-500"
                      />
                      <span className={`text-lg ${todo.completed ? "line-through text-gray-400" : ""}`}>
                        {todo.text}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteTodo(todo._id)}
                      className="text-red-500 text-2xl font-bold hover:scale-110"
                    >
                      ✕
                    </button>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}

function Stat({ title, value, color }) {
  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-r ${color} text-white shadow-xl`}>
      <p className="opacity-80">{title}</p>
      <h2 className="text-4xl font-extrabold">{value}</h2>
    </div>
  );
}
