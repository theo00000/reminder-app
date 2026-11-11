"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { CreateReminderInput } from "../../models/Reminder";

interface FormProps {
  onAddReminder: (reminder: CreateReminderInput) => Promise<void>;
  saving: boolean;
}

export function ReminderForm({ onAddReminder, saving }: FormProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim() || !date) {
      setError("Please complete required fields.");
      return;
    }

    const dueDate = new Date(date);

    if (Number.isNaN(dueDate.getTime())) {
      setError("Invalid reminder date.");
      return;
    }

    setError("");

    try {
      await onAddReminder({
        title: title.trim(),
        description: description.trim(),
        dueAt: dueDate.toISOString(),
      });

      setTitle("");
      setDate("");
      setDescription("");
    } catch {
      setError("Failed to save reminder.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium">
          Task Title
        </label>
        <input
          id="title"
          type="text"
          placeholder="Enter reminder title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label htmlFor="dueAt" className="mb-2 block text-sm font-medium">
          Due Date
        </label>
        <input
          id="dueAt"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Add Reminder"}
      </button>
    </form>
  );
}
