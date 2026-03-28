interface User {
  id: string;
  name: string;
  email: string;
}

const users: User[] = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
];

export async function findAllUsers(): Promise<User[]> {
  return [...users];
}

export async function findUserById(id: string): Promise<User | undefined> {
  return users.find((u) => u.id === id);
}

export async function createUser(user: User): Promise<User> {
  users.push(user);
  return user;
}
