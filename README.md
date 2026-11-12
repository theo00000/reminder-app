# Reminder App - Project Documentation

**Status:** implementasi awal (Create + Read), dengan rancangan CRUD lanjutan dan notifikasi terjadwal.
**Stack:** Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Turso/libSQL, Vercel.
**Sumber dokumentasi:** struktur dan kode branch `master` dari `theo00000/reminder-app`, diperiksa 13 November 2026. Perubahan yang hanya ada di lokal belum tentu tercakup.

**As-Is vs To-Be:** Semua diagram dan tabel menandai implementasi aktual atau rencana. Jangan menganggap PATCH, DELETE, login, dan push notification sudah siap hanya karena tercantum sebagai rancangan.

## Ringkasan

Reminder App adalah aplikasi web pengelolaan pengingat berbasis tenggat waktu. Pengguna dapat membuat dan melihat reminder, melihat statistik status pada dashboard, serta menyimpan data ke database Turso melalui REST-style Route Handlers Next.js.

## Status fitur

| Kapabilitas | Status pada branch `master` yang diperiksa | Lokasi |
| --- | --- | --- |
| Menambah reminder | Diimplementasikan | `ReminderForm.tsx`, `POST /api/reminders` |
| Menampilkan reminder | Diimplementasikan | `page.tsx`, `GET /api/reminders` |
| Statistik total / completed / overdue | Diimplementasikan di UI | `app/page.tsx` |
| Edit / complete / delete | Rencana, belum ditemukan pada branch yang diperiksa | `/api/reminders/[id]`, `ReminderCard.tsx` |
| Search / filter | Rencana | `ReminderList.tsx` |
| Scheduler | Prototipe kelas tersedia; belum ada proses deployment yang memulainya | `app/services/Scheduler.ts` |
| Browser/server push notification | Belum andal untuk production | `NotificationEngine.ts` |
| Akun, login, isolasi data per pengguna | Belum tersedia | — |

## Dokumen teknis

- [Arsitektur dan komponen](docs/ARCHITECTURE.md): system context, module diagram, deployment, keamanan.
- [Database dan ERD](docs/DATABASE.md): ERD As-Is, relational schema, aturan data, relasi To-Be.
- [Alur proses](docs/WORKFLOWS.md): DFD, sequence Create/Read, perubahan status, scheduler.
- [Kontrak API](docs/API.md): endpoint saat ini, payload, respons, error, serta endpoint yang direncanakan.
