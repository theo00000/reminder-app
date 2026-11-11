"use client";

import { useEffect, useState } from "react";
import { ReminderForm } from "./frontend/components/ReminderForm";
import type { Reminder, CreateReminderInput } from "./models/Reminder";

async function getReminders(signal?: AbortSignal): Promise<Reminder[]> {
  const response = await fetch("/api/reminders", {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil reminder (${response.status})`);
  }

  return (await response.json()) as Reminder[];
}

export default function Home() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getReminders(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setReminders(data);
          setNow(Date.now());
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  async function handleAddReminder(input: CreateReminderInput): Promise<void> {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan reminder");
      }

      const updatedReminders = await getReminders();

      setReminders(updatedReminders);
      setNow(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");

      throw err;
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const completed = reminders.filter((reminder) => reminder.isCompleted).length;

  const overdue = reminders.filter(
    (reminder) =>
      !reminder.isCompleted &&
      now > 0 &&
      new Date(reminder.dueAt).getTime() < now,
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Reminder App</h1>
          <p className="mt-2 text-slate-500">
            Manage your tasks and never miss a deadline.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Reminders",
              value: reminders.length,
            },
            {
              label: "Completed",
              value: completed,
            },
            {
              label: "Overdue",
              value: overdue,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-xl font-semibold">Create Reminder</h2>

          <ReminderForm onAddReminder={handleAddReminder} saving={saving} />
        </section>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </p>
        )}

        <section>
          <h2 className="mb-5 text-xl font-semibold">Your Reminders</h2>

          {loading ? (
            <p className="text-slate-500">Loading reminders...</p>
          ) : reminders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-medium">No reminders yet</p>
              <p className="mt-2 text-sm text-slate-500">
                Create your first reminder above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reminders.map((reminder) => {
                const isOverdue =
                  !reminder.isCompleted &&
                  now > 0 &&
                  new Date(reminder.dueAt).getTime() < now;

                return (
                  <article
                    key={reminder.id}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">{reminder.title}</h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          reminder.isCompleted
                            ? "bg-green-100 text-green-700"
                            : isOverdue
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {reminder.isCompleted
                          ? "Completed"
                          : isOverdue
                            ? "Overdue"
                            : "Pending"}
                      </span>
                    </div>

                    {reminder.description && (
                      <p className="mt-3 text-sm text-slate-600">
                        {reminder.description}
                      </p>
                    )}

                    <p className="mt-4 text-sm text-slate-500">
                      Due: {formatDate(reminder.dueAt)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
