"use client";

import { useEffect, useState } from "react";
import { ReminderForm } from "./frontend/components/ReminderForm";
import { ReminderList } from "./frontend/components/ReminderList";

import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
} from "./models/Reminder";

async function getReminders(signal?: AbortSignal): Promise<Reminder[]> {
  const response = await fetch("/api/reminders", {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil reminder (${response.status})`);
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Format respons API tidak valid");
  }

  return data as Reminder[];
}
async function checkResponse(
  response: Response,
  fallback: string,
): Promise<void> {
  if (response.ok) return;

  let message = fallback;

  try {
    const data: unknown = await response.json();

    if (
      data !== null &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      message = data.error;
    }
  } catch {}

  throw new Error(`${message} (${response.status})`);
}

export default function Home() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

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

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  async function refreshReminders() {
    const data = await getReminders();
    setReminders(data);
    setNow(Date.now());
  }

  async function handleAddReminder(input: CreateReminderInput): Promise<void> {
    setSaving(true);
    setError("");

    let created = false;

    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      await checkResponse(response, "Gagal menyimpan reminder");

      created = true;
      await refreshReminders();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";

      setError(
        created
          ? "Reminder tersimpan, tetapi daftar gagal diperbarui."
          : message,
      );

      if (!created) throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateReminder(
    id: number,
    input: UpdateReminderInput,
  ): Promise<void> {
    setBusyId(id);
    setError("");

    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      await checkResponse(response, "Gagal memperbarui reminder");

      await refreshReminders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");

      throw err;
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteReminder(id: number): Promise<void> {
    setBusyId(id);
    setError("");

    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });

      await checkResponse(response, "Gagal menghapus reminder");

      await refreshReminders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");

      throw err;
    } finally {
      setBusyId(null);
    }
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
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600"
          >
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Loading reminders...</p>
        ) : (
          <ReminderList
            reminders={reminders}
            now={now}
            busyId={busyId}
            onUpdate={handleUpdateReminder}
            onDelete={handleDeleteReminder}
          />
        )}
      </div>
    </main>
  );
}
