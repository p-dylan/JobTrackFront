import type { User } from "../types/user.type";

// "Geoffrey Cugnon" => "GC"
export function getInitials(user: Pick<User, "first_name" | "last_name"> | null): string {
  if (!user) return "";
  return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
}

// { first_name, last_name } => "Geoffrey Cugnon".
export function getFullName(user: Pick<User, "first_name" | "last_name"> | null): string {
  if (!user) return "";
  return `${user.first_name} ${user.last_name}`;
}
