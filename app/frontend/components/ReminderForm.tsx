import React, { useState } from "react";
import { Reminder } from "../models/Reminder";

interface FormProps {
  onAddReminder: (reminder: Reminder) => void;
}

export const ReminderForm: React.FC<FormProps> = ({ onAddReminder }) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return alert("Please complete required fields");

    const newReminder = new Reminder(title, new Date(date), desc);
    onAddReminder(newReminder);

    setTitle("");
    setDate("");
    setDesc("");
  };

  return (
    <form onSubmit={handleSubmit} className="reminder-form">
      <input
        type="text"
        placeholder="Task Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Description (optional)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <input
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
    </form>
  );
};
