
export interface TodoItemInput {
  id?: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm: string;
}

export interface TodoSnapshot {
  items: TodoItemInput[];
  stats: { total: number; completed: number; inProgress: number };
}

export class TodoBoard {
  items: TodoItemInput[] = [];

  load(items: TodoItemInput[]) {
    this.items = [...items];
  }

  update(items: TodoItemInput[]): TodoSnapshot {
    const seen = new Set<string>();
    let inProgress = 0;
    const cleaned: TodoItemInput[] = [];

    for (let index = 0; index < items.length; index += 1) {
      const raw = items[index];
      const id = String(raw.id ?? index + 1);
      if (seen.has(id)) {
        throw new Error(`Duplicate todo id: ${id}`);
      }
      seen.add(id);

      const status = raw.status;
      if (![`pending`, `in_progress`, `completed`].includes(status)) {
        throw new Error("Invalid todo status");
      }
      if (status === "in_progress") inProgress += 1;

      cleaned.push({
        id,
        content: raw.content.trim(),
        status,
        activeForm: raw.activeForm.trim(),
      });
    }

    if (inProgress > 1) {
      throw new Error("Only one todo can be in_progress");
    }

    this.items = cleaned;
    return this.snapshot();
  }

  snapshot(): TodoSnapshot {
    const stats = {
      total: this.items.length,
      completed: this.items.filter((t) => t.status === "completed").length,
      inProgress: this.items.filter((t) => t.status === "in_progress").length,
    };
    return { items: this.items, stats };
  }
}
