import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../api";
const API = `${API_BASE_URL}/api/todos`;
export default function Dashboard({ setAuth }) {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [priority, setPriority] = useState("Low");
  const [category, setCategory] = useState("General");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("All"); // All, Active, Completed
  const [activeCategory, setActiveCategory] = useState("All");
  const [user, setUser] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchTodos();
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUser(data);
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  }

  async function fetchTodos() {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function addTodo() {
    if (!text.trim()) return;

    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        priority,
        category,
        dueDate: dueDate || null,
        description
      }),
    });

    setText("");
    setDueDate("");
    setPriority("Low");
    setDescription("");
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

  async function updateTodo(id, updates = {}) {
    const todoToUpdate = todos.find(t => t._id === id);
    if (!todoToUpdate) return;

    const body = {
      text: updates.text !== undefined ? updates.text : todoToUpdate.text,
      completed: updates.completed !== undefined ? updates.completed : todoToUpdate.completed,
      priority: updates.priority !== undefined ? updates.priority : todoToUpdate.priority,
      category: updates.category !== undefined ? updates.category : todoToUpdate.category,
      dueDate: updates.dueDate !== undefined ? updates.dueDate : todoToUpdate.dueDate,
      description: updates.description !== undefined ? updates.description : todoToUpdate.description
    };

    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditingId(null);
    setEditText("");
    fetchTodos();
  }

  function startEditing(todo) {
    setEditingId(todo._id);
    setEditText(todo.text);
  }

  function logout() {
    localStorage.removeItem("token");
    setAuth(false);
  }

  const categories = ["All", ...new Set(todos.map(t => t.category || "General"))];

  const filteredTodos = todos
    .filter((t) => t.text.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => {
      if (filter === "Active") return !t.completed;
      if (filter === "Completed") return t.completed;
      return true;
    })
    .filter((t) => {
      if (activeCategory === "All") return true;
      return (t.category || "General") === activeCategory;
    });

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-all">

        {/* SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6">
          <div className="mb-10">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-8">
              TASKFLOW PRO
            </h1>

            <nav className="space-y-1">
              {["All", "Active", "Completed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-all ${filter === f
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                >
                  <span>{f} Tasks</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mb-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-4">Categories</h3>
            <div className="space-y-1 text-sm font-medium">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeCategory === cat
                    ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 font-bold"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                >
                  # {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 transition-colors font-bold"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* NAVBAR */}
          <header className="flex justify-between items-center px-10 py-5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-10">
            <div className="lg:hidden">
              <h1 className="text-xl font-black text-indigo-600">TF</h1>
            </div>

            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your tasks..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDark(!dark)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {dark ? "☀" : "🌙"}
              </button>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold hover:scale-110 transition cursor-pointer"
              >
                {user?.name?.[0]?.toUpperCase() || "U"}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-10 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto">

              {/* WELCOME */}
              <div className="mb-10">
                <h2 className="text-4xl font-black text-gray-800 dark:text-white mb-2">My Tasks</h2>
                <p className="text-gray-500 dark:text-gray-400">Manage your productivity and daily goals with ease.</p>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-3xl font-black dark:text-white">{todos.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1">Completed</p>
                  <p className="text-3xl font-black dark:text-white">{completedCount}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hidden md:block">
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Success Rate</p>
                  <p className="text-3xl font-black dark:text-white">{todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0}%</p>
                </div>
              </div>

              {/* PRODUCTIVITY CARD */}
              <div className="mb-10 bg-gradient-to-r from-indigo-600 to-purple-700 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-4">Productivity Progress</h3>
                  <div className="w-full bg-white/20 rounded-full h-3 mb-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }}
                      className="h-full bg-white"
                    />
                  </div>
                  <p className="text-white/80 text-sm italic">
                    {completedCount === todos.length && todos.length > 0 ? "You're all caught up! High five! 👋" : "Keep going! You're making progress every single day."}
                  </p>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4 scale-150">
                  <svg className="w-48 h-48" fill="white" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                </div>
              </div>

              {/* INPUT SECTION */}
              <section className="bg-white dark:bg-gray-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-indigo-500/20 mb-10 transition-all hover:border-indigo-500/40 hover:shadow-indigo-500/10">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="What needs to be done?"
                        className="w-full text-xl font-bold bg-transparent border-none outline-none focus:ring-0 dark:text-white dark:placeholder-white/40 py-2"
                      />
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a detailed description..."
                        className="w-full text-md font-medium bg-transparent border-none outline-none focus:ring-0 dark:text-indigo-100/70 dark:placeholder-indigo-100/30 py-1 resize-none h-16"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(99, 102, 241, 0.4)",
                          "0 0 40px rgba(168, 85, 247, 0.6)",
                          "0 0 20px rgba(99, 102, 241, 0.4)"
                        ]
                      }}
                      transition={{
                        boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                      onClick={addTodo}
                      disabled={!text.trim()}
                      className="group relative inline-flex items-center justify-center px-10 py-4 font-black text-white transition-all duration-300 bg-gradient-to-br from-cyan-400 via-indigo-600 to-purple-700 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] disabled:opacity-50 disabled:shadow-none overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2 text-lg">
                        Add New Task
                        <motion.span
                          animate={{ rotate: [0, 90, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-2xl"
                        >
                          +
                        </motion.span>
                      </span>

                      {/* SHINY SWEEP EFFECT */}
                      <div className="absolute inset-0 w-full h-full transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-30deg]"></div>

                      {/* ELECTRIC BORDER GLOW */}
                      <div className="absolute inset-0 rounded-2xl border-2 border-white/30 group-hover:border-white/60 transition-colors"></div>
                    </motion.button>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">PRIORITY</span>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm px-3 py-1 outline-none dark:text-gray-300"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">CATEGORY</span>
                      <input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Work, Life..."
                        className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm px-3 py-1 outline-none w-24 dark:text-gray-300"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">DUE DATE</span>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm px-3 py-1 outline-none dark:text-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* TASK LIST */}
              <AnimatePresence mode="popLayout">
                {filteredTodos.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                  >
                    <div className="text-6xl mb-4">✨</div>
                    <h3 className="text-xl font-bold text-gray-400">No tasks found in this view</h3>
                  </motion.div>
                ) : (
                  <ul className="space-y-4">
                    {filteredTodos.map((todo) => (
                      <motion.li
                        key={todo._id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ y: -2 }}
                        className="group flex items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md cursor-pointer"
                        onClick={() => setSelectedTask(todo)}
                      >
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleTodo(todo._id, todo.completed);
                          }}
                          className="w-6 h-6 rounded-full border-2 border-indigo-500 checked:bg-indigo-500 transition-all cursor-pointer appearance-none checked:after:content-['✓'] checked:after:text-white checked:after:flex checked:after:justify-center checked:after:items-center"
                        />

                        <div className="flex-1 min-w-0">
                          {editingId === todo._id ? (
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                autoFocus
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && updateTodo(todo._id, { text: editText })}
                                className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 outline-none dark:text-white"
                              />
                              <button onClick={() => updateTodo(todo._id, { text: editText })} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Save</button>
                            </div>
                          ) : (
                            <div>
                              <h3 className={`text-lg font-semibold truncate transition-all ${todo.completed ? "line-through text-gray-400 opacity-60" : "text-gray-800 dark:text-white"}`}>
                                {todo.text}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 mt-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${todo.priority === "High" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                  todo.priority === "Medium" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                                    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                  }`}>
                                  {todo.priority || "Low"}
                                </span>
                                {todo.category && (
                                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                    {todo.category}
                                  </span>
                                )}
                                {todo.dueDate && (
                                  <span className="text-xs font-bold text-indigo-500 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">
                                    📅 {new Date(todo.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {editingId !== todo._id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(todo);
                              }}
                              className="p-2 text-gray-400 hover:text-indigo-600 transition"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTodo(todo._id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* TASK DETAIL MODAL */}
        <AnimatePresence>
          {selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setSelectedTask(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedTask(null)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
                >
                  ✕
                </button>

                <div className="mb-6">
                  <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block ${selectedTask.priority === "High" ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                    selectedTask.priority === "Medium" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30" :
                      "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                    }`}>
                    {selectedTask.priority} Priority
                  </span>
                  <h2 className="text-3xl font-black text-gray-800 dark:text-white leading-tight">
                    {selectedTask.text}
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h4>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {selectedTask.description || "No description provided for this task."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-8 py-6 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Due Date</h4>
                      <p className="text-indigo-600 font-bold">
                        {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "No deadline"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Category</h4>
                      <p className="text-purple-600 font-bold">
                        {selectedTask.category || "General"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button
                    onClick={() => {
                      toggleTodo(selectedTask._id, selectedTask.completed);
                      setSelectedTask(null);
                    }}
                    className={`flex-1 py-4 rounded-2xl font-bold transition ${selectedTask.completed
                      ? "bg-gray-100 text-gray-600 dark:bg-gray-800"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                  >
                    {selectedTask.completed ? "Mark as Active" : "Mark as Completed"}
                  </button>
                  <button
                    onClick={() => {
                      deleteTodo(selectedTask._id);
                      setSelectedTask(null);
                    }}
                    className="px-6 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 transition font-bold"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PROFILE DROPDOWN/MODAL */}
        <AnimatePresence>
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-20 right-10 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 w-64"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl text-white font-black">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-white">{user?.name || "User"}</h3>
                  <p className="text-sm text-gray-400">{user?.email || "No email"}</p>
                </div>
                <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={logout}
                    className="w-full py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition font-bold"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
