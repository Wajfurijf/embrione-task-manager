
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadTasks() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setTasks(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function addTask(event) {
    event.preventDefault();

    const cleanTitle = title.trim();
    if (!cleanTitle || saving) return;

    setSaving(true);
    setError("");

    const { data, error } = await supabase
      .from("tasks")
      .insert({ title: cleanTitle })
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      setTasks((current) => [data, ...current]);
      setTitle("");
    }

    setSaving(false);
  }

  async function toggleTask(task) {
    setError("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id)
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? data : item
        )
      );
    }
  }

  async function deleteTask(id) {
    setError("");

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setTasks((current) =>
        current.filter((task) => task.id !== id)
      );
    }
  }

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  return (
    <main className="page">
      <section className="task-card">
        <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
        <h1>Task Manager</h1>
        <p className="subtitle">
          Make progress, one task at a time.
        </p>

        <div className="stats">
          <span>{tasks.length} total tasks</span>
          <span>{completedCount} completed</span>
        </div>

        <form onSubmit={addTask} className="task-form">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What do you need to do?"
            maxLength={200}
            aria-label="New task"
          />
          <button disabled={saving || !title.trim()}>
            {saving ? "Adding..." : "Add task"}
          </button>
        </form>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="empty">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="empty">
            No tasks yet. Add your first one above!
          </p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className="task-row">
                <label className="task-label">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                  />
                  <span
                    className={
                      task.completed ? "completed" : ""
                    }
                  >
                    {task.title}
                  </span>
                </label>

                <button
                  className="delete-button"
                  onClick={() => deleteTask(task.id)}
                  aria-label={`Delete ${task.title}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          className="refresh-button"
          onClick={loadTasks}
          disabled={loading}
        >
          Refresh tasks
        </button>
      </section>
    </main>
  );
}
