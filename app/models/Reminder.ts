
export interface Reminder {
    id: number;
    title: string;
    description: string | null;
    dueAt: string;
    isCompleted: boolean;
    notifiedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type CreateReminderInput = {
    title: string;
    description?: string;
    dueAt: string;
};

export type UpdateReminderInput = Partial<
    CreateReminderInput & {
        isCompleted: boolean;
    }
>;
