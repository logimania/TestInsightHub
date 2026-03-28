import { findAllUsers, findUserById } from "../repo/user-repo";

export async function getUsers() {
  return findAllUsers();
}

export async function getUserById(id: string) {
  const user = await findUserById(id);
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  return user;
}

export function formatUserName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}
