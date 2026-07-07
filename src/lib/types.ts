export type Profile = {
  id: string;
  full_name: string;
  avatar_color: number;
};

export type Group = {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
};

export type GroupMember = {
  group_id: string;
  profile_id: string;
};

export type Priority = "baja" | "media" | "alta";
export type Status = "todo" | "doing" | "done";

export type Task = {
  id: string;
  ticket: string;
  group_id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  priority: Priority;
  status: Status;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
};

export const STATUSES: { id: Status; label: string; dot: string }[] = [
  { id: "todo", label: "Por hacer", dot: "#9B9FAE" },
  { id: "doing", label: "En progreso", dot: "#2F5DE3" },
  { id: "done", label: "Hecho", dot: "#2F9E5B" },
];

export const PRIORITIES: Priority[] = ["baja", "media", "alta"];

export const AVATAR_COLORS = [
  "#2F5DE3",
  "#D85A30",
  "#0F6E56",
  "#9A3B7A",
  "#B98900",
  "#3A7D2C",
  "#6E4FC9",
  "#C4432E",
];

export function colorFor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
