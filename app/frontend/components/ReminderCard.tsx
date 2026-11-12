"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { Reminder, UpdateReminderInput } from "../../models/Reminder";

interface Props {
  reminder: Reminder;
  now: number;
  busy: boolean;
  onUpdate: (id: number, data: UpdateReminderInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function toLocalDateTime(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function ReminderCard({
  reminder,
  now,
  busy,
  onUpdate,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(reminder.title);
  const [description, setDescription] = useState(reminder.description ?? "");
  const [dueAt, setDueAt] = useState(toLocalDateTime(reminder.dueAt));
  const [error, setError] = useState("");

  const overdue =
    !reminder.isCompleted &&
    now > 0 &&
    new Date(reminder.dueAt).getTime() < now;

  function startEditing() {
    setTitle(reminder.title);
    setDescription(reminder.description ?? "");
    setDueAt(toLocalDateTime(reminder.dueAt));
    setError("");
    setEditing(true);
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const date = new Date(dueAt);

    if (!title.trim() || !Number.isFinite(date.getTime())) {
      setError("Judul atau tanggal tidak valid.");
      return;
    }

    setError("");

    try {
      await onUpdate(reminder.id, {
        title: title.trim(),
        description,
        dueAt: date.toISOString(),
      });

      setEditing(false);
    } catch {
      setError("Gagal mengubah reminder. Cek pesan di dashboard.");
    }
  }

  async function handleToggle() {
    try {
      await onUpdate(reminder.id, {
        isCompleted: !reminder.isCompleted,
      });
    } catch {
      // Error ditampilkan oleh halaman utama.
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Yakin ingin menghapus "${reminder.title}"?`,
    );

    if (!confirmed) return;

    try {
      await onDelete(reminder.id);
    } catch {
      // Error ditampilkan oleh halaman utama.
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <h3 className="font-semibold">Edit Reminder</h3>

          <input
            aria-label="Reminder title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={busy}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <textarea
            aria-label="Reminder description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <input
            aria-label="Reminder date"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            required
            disabled={busy}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <label className="flex min-w-0 items-start gap-3">
              <input
                type="checkbox"
                checked={reminder.isCompleted}
                disabled={busy}
                onChange={() => void handleToggle()}
                className="mt-1 h-4 w-4 accent-indigo-600"
              />

              <span
                className={`break-words font-semibold ${
                  reminder.isCompleted
                    ? "text-slate-400 line-through"
                    : "text-slate-900"
                }`}
              >
                {reminder.title}
              </span>
            </label>

            <span
              className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                reminder.isCompleted
                  ? "bg-green-100 text-green-700"
                  : overdue
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {reminder.isCompleted
                ? "Completed"
                : overdue
                  ? "Overdue"
                  : "Pending"}
            </span>
          </div>

          {reminder.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
              {reminder.description}
            </p>
          )}

          <p className="mt-4 text-sm text-slate-500">
            Due:{" "}
            {new Date(reminder.dueAt).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>

          <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={startEditing}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Edit
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDelete()}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </article>
  );
}
