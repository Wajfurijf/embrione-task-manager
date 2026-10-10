
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

  try {
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title: cleanTitle })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      setError(`Supabase insert failed: ${error.message}`);
      return;
    }

    console.log("Supabase saved task:", data);
    setTasks((current) => [data, ...current]);
    setTitle("");
  } catch (err) {
    console.error("Unexpected insert error:", err);
    setError("Unexpected error while saving the task.");
  } finally {
    setSaving(false);
  }
}
  async function deleteTask(id) {
    setError("");

    
    const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    setError("Delete failed: " + error.message);
    return;
  }

  if (!data) {
    setError(
      "No task was deleted. Check your Supabase DELETE policy."
    );
    return;
  }

  setTasks((current) =>
    current.filter((task) => task.id !== id)
  );
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
