import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  AssignUserRoleBody,
  AssignUserRoleResponse,
  GetUserRoleResponse,
  RegisterUserBody,
  RegisterUserResponse,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/user/:address/role", async (req, res): Promise<void> => {
  const rawAddress = Array.isArray(req.params.address)
    ? req.params.address[0]
    : req.params.address;
  const address = rawAddress.trim();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.address, address))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserRoleResponse.parse({ role: user.role }));
});

router.post("/user/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const address = parsed.data.address.trim();
  const name = parsed.data.name.trim();
  if (!address || !name) {
    res.status(400).json({ error: "address and name are required" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ address, name, role: "USER" })
    .onConflictDoNothing({ target: usersTable.address })
    .returning();

  if (!user) {
    res.status(409).json({ error: "User already exists" });
    return;
  }

  res.status(201).json(RegisterUserResponse.parse({ success: true, user }));
});

router.post("/user/assign-role", async (req, res): Promise<void> => {
  const parsed = AssignUserRoleBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const address = parsed.data.address.trim();
  const role = parsed.data.role.trim();
  if (!address || !role) {
    res.status(400).json({ error: "address and role are required" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ role })
    .where(eq(usersTable.address, address))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(AssignUserRoleResponse.parse({ success: true, user }));
});

export default router;