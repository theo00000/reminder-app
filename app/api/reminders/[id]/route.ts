import { NextResponse } from "next/server";
import { getDb } from "../../../config/database";

type RouteContext = {
    params: Promise<{ id: string }>;
};

async function parseId(context: RouteContext) {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (
        !/^[1-9]\d*$/.test(rawId) ||
        !Number.isSafeInteger(id)
    ) {
        return null;
    }

    return id;
}

// ======================================
// PATCH - Update / Complete Reminder
// ======================================

export async function PATCH(
    request: Request,
    context: RouteContext
) {
    const id = await parseId(context);

    if (id === null) {
        return NextResponse.json(
            { error: "Invalid reminder ID" },
            { status: 400 }
        );
    }

    let body: Record<string, unknown>;

    try {
        const payload: unknown = await request.json();

        if (
            typeof payload !== "object" ||
            payload === null ||
            Array.isArray(payload)
        ) {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        body = payload as Record<string, unknown>;
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON" },
            { status: 400 }
        );
    }

    const fields: string[] = [];
    const args: (string | number | null)[] = [];

    // Update title
    if ("title" in body) {
        if (
            typeof body.title !== "string" ||
            !body.title.trim()
        ) {
            return NextResponse.json(
                { error: "Invalid title" },
                { status: 400 }
            );
        }

        fields.push("title = ?");
        args.push(body.title.trim());
    }

    // Update description
    if ("description" in body) {
        if (
            body.description !== null &&
            typeof body.description !== "string"
        ) {
            return NextResponse.json(
                { error: "Invalid description" },
                { status: 400 }
            );
        }

        fields.push("description = ?");
        args.push(
            typeof body.description === "string"
                ? body.description.trim() || null
                : null
        );
    }

    // Update due date
    if ("dueAt" in body) {
        if (
            typeof body.dueAt !== "string" ||
            !Number.isFinite(Date.parse(body.dueAt))
        ) {
            return NextResponse.json(
                { error: "Invalid due date" },
                { status: 400 }
            );
        }

        fields.push("due_at = ?");
        args.push(new Date(body.dueAt).toISOString());
    }

    // Complete / Uncomplete
    if ("isCompleted" in body) {
        if (typeof body.isCompleted !== "boolean") {
            return NextResponse.json(
                { error: "Invalid completion status" },
                { status: 400 }
            );
        }

        fields.push("is_completed = ?");
        args.push(body.isCompleted ? 1 : 0);
    }

    if (fields.length === 0) {
        return NextResponse.json(
            { error: "No valid fields to update" },
            { status: 400 }
        );
    }

    // Reset notification when rescheduled or reopened
    if (
        "dueAt" in body ||
        body.isCompleted === false
    ) {
        fields.push("notified_at = NULL");
    }

    fields.push("updated_at = ?");
    args.push(new Date().toISOString());
    args.push(id);

    try {
        const db = getDb();

        const result = await db.execute({
            sql: `
        UPDATE reminders
        SET ${fields.join(", ")}
        WHERE id = ?
      `,
            args,
        });

        if (result.rowsAffected === 0) {
            return NextResponse.json(
                { error: "Reminder not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Reminder updated successfully",
        });
    } catch (error) {
        console.error("PATCH reminder error:", error);

        return NextResponse.json(
            { error: "Failed to update reminder" },
            { status: 500 }
        );
    }
}

// ======================================
// DELETE - Delete Reminder
// ======================================

export async function DELETE(
    _request: Request,
    context: RouteContext
) {
    const id = await parseId(context);

    if (id === null) {
        return NextResponse.json(
            { error: "Invalid reminder ID" },
            { status: 400 }
        );
    }

    try {
        const db = getDb();

        const result = await db.execute({
            sql: "DELETE FROM reminders WHERE id = ?",
            args: [id],
        });

        if (result.rowsAffected === 0) {
            return NextResponse.json(
                { error: "Reminder not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Reminder deleted successfully",
        });
    } catch (error) {
        console.error("DELETE reminder error:", error);

        return NextResponse.json(
            { error: "Failed to delete reminder" },
            { status: 500 }
        );
    }
}