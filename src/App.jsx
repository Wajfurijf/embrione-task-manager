import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load tasks from Supabase
  async function loadTasks() {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setTasks(data ?? []);
    } catch (err) {
      console.error("Load tasks error:", err);
      setError("Could not load tasks: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load tasks when the page opens
  useEffect(() => {
    loadTasks();
  }, []);

  // Add a new task
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
        throw error;
      }

      setTasks((current) => [data, ...current]);
      setTitle("");
    } catch (err) {
      console.error("Add task error:", err);
      setError("Could not add task: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Mark a task as completed or incomplete
  async function toggleTask(task) {
    setError("");

    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", task.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? data : item
        )
      );
    } catch (err) {
      console.error("Update task error:", err);
      setError("Could not update task: " + err.message);
    }
  }

  // Delete a task
  async function deleteTask(id) {
    setError("");

    try {
      const { data, error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
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
    } catch (err) {
      console.error("Delete task error:", err);
      setError("Could not delete task: " + err.message);
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
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What do you need to do?"
            maxLength={200}
            aria-label="New task"
          />

          <button
            type="submit"
            disabled={saving || !title.trim()}
          >
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
                    checked={Boolean(task.completed)}
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
                  type="button"
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
          type="button"
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