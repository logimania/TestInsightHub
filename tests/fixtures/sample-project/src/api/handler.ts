import { getUsers } from "../service/user-service";

export async function handleGetUsers(req: any, res: any) {
  const users = await getUsers();
  if (users.length === 0) {
    return res.status(404).json({ error: "No users found" });
  }
  return res.json(users);
}

export function handleHealthCheck(_req: any, res: any) {
  return res.json({ status: "ok" });
}
