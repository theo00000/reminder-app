"use client";

import { useEffect, useState } from "react";
import { ReminderForm } from "./frontend/components/ReminderForm";
import type { Reminder, CreateReminderInput } from "./models/Reminder";

// ==============================
// API: GET REMINDERS
// ==============================

async function getReminders(signal?: AbortSignal): Promise<Reminder[]> {
  const response = await fetch("/api/reminders", {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil reminder (${response.status})`);
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid API response: expected an array of reminders");
  }

  return data as Reminder[];
}

// ==============================
// DATE FORMATTER
// ==============================

function formatDate(date: string): string {
  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ==============================
// HOME PAGE
// ==============================

export default function Home() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  // ==============================
  // LOAD REMINDERS
  // ==============================

  useEffect(() => {
    const controller = new AbortController();

    getReminders(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;

        setReminders(data);
        setNow(Date.now());
        setError("");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;

        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    // Update waktu setiap menit
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  // ==============================
  // CREATE REMINDER
  // ==============================

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
        throw new Error(`Gagal menyimpan reminder (${response.status})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan reminder");

      throw err;
    } finally {
      setSaving(false);
    }

    // Refresh daftar setelah berhasil disimpan
    try {
      const updatedReminders = await getReminders();

      setReminders(updatedReminders);
      setNow(Date.now());
    } catch {
      setError(
        "Reminder tersimpan, tetapi daftar gagal diperbarui. Refresh halaman untuk melihat data terbaru.",
      );
    }
  }

  // ==============================
  // STATISTICS
  // ==============================

  const total = reminders.length;

  const completed = reminders.filter((reminder) => reminder.isCompleted).length;

  const overdue = reminders.filter(
    (reminder) =>
      !reminder.isCompleted &&
      now > 0 &&
      new Date(reminder.dueAt).getTime() < now,
  ).length;

  // ==============================
  // UI
  // ==============================

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* HEADER */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Reminder App</h1>

          <p className="mt-2 text-slate-500">
            Manage your tasks and never miss a deadline.
          </p>
        </header>

        {/* STATISTICS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Reminders",
              value: total,
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

        {/* CREATE REMINDER */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-xl font-semibold">Create Reminder</h2>

          <ReminderForm onAddReminder={handleAddReminder} saving={saving} />
        </section>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600"
          >
            {error}
          </div>
        )}

        {/* REMINDER LIST */}
        <section>
          <h2 className="mb-5 text-xl font-semibold">Your Reminders</h2>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-slate-500">Loading reminders...</p>
            </div>
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
                    className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    {/* CARD HEADER */}
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

                    {/* DESCRIPTION */}
                    {reminder.description && (
                      <p className="mt-3 text-sm text-slate-600">
                        {reminder.description}
                      </p>
                    )}

                    {/* DUE DATE */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="text-sm text-slate-500">
                        Due: {formatDate(reminder.dueAt)}
                      </p>
                    </div>
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
