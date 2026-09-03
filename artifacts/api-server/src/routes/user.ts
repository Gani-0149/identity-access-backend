import { Router, type IRouter } from "express";
import {
  AssignUserRoleBody,
  AssignUserRoleResponse,
  GetUserRoleResponse,
  RegisterUserBody,
  RegisterUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type RegisteredUser = {
  address: string;
  name: string;
  role: string;
};

const registeredUsers: RegisteredUser[] = [];

router.get("/user/:address/role", (req, res) => {
  const address = req.params.address.trim();
  const user = registeredUsers.find((registeredUser) => registeredUser.address === address);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserRoleResponse.parse({ role: user.role }));
});

router.post("/user/register", (req, res) => {
  const parsed = RegisterUserBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user: RegisteredUser = {
    address: parsed.data.address.trim(),
    name: parsed.data.name.trim(),
    role: "USER",
  };

  registeredUsers.push(user);
  res.status(201).json(RegisterUserResponse.parse({ success: true, user }));
});

router.post("/user/assign-role", (req, res) => {
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

  const user = registeredUsers.find((registeredUser) => registeredUser.address === address);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  user.role = role;
  res.json(AssignUserRoleResponse.parse({ success: true, user }));
});

export default router;