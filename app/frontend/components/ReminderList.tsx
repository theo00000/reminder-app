"use client";

import { useState } from "react";
import { ReminderCard } from "./ReminderCard";
import type { Reminder, UpdateReminderInput } from "../../models/Reminder";

type Filter = "all" | "pending" | "completed" | "overdue";

interface Props {
  reminders: Reminder[];
  now: number;
  busyId: number | null;
  onUpdate: (id: number, data: UpdateReminderInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function ReminderList({
  reminders,
  now,
  busyId,
  onUpdate,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "overdue", label: "Overdue" },
  ];

  const filtered = reminders.filter((reminder) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      reminder.title.toLowerCase().includes(query) ||
      (reminder.description ?? "").toLowerCase().includes(query);

    const overdue =
      !reminder.isCompleted &&
      now > 0 &&
      new Date(reminder.dueAt).getTime() < now;

    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !reminder.isCompleted) ||
      (filter === "completed" && reminder.isCompleted) ||
      (filter === "overdue" && overdue);

    return matchesSearch && matchesFilter;
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold">Your Reminders</h2>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reminders..."
          aria-label="Search reminders"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === item.value
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium">No reminders found</p>
          <p className="mt-2 text-sm text-slate-500">
            Try another filter or create a reminder.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              now={now}
              busy={busyId !== null}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
