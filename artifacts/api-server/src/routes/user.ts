import { Router, type IRouter } from "express";

const router: IRouter = Router();

type RegisteredUser = {
  address: string;
  name: string;
};

const registeredUsers: RegisteredUser[] = [];

router.get("/user/:address/role", (_req, res) => {
  res.json({ role: "USER" });
});

router.post("/user/register", (req, res) => {
  const { address, name } = req.body as Partial<RegisteredUser>;

  if (
    typeof address !== "string" ||
    address.trim().length === 0 ||
    typeof name !== "string" ||
    name.trim().length === 0
  ) {
    res.status(400).json({
      success: false,
      error: "address and name are required",
    });
    return;
  }

  const user: RegisteredUser = {
    address: address.trim(),
    name: name.trim(),
  };

  registeredUsers.push(user);
  res.status(201).json({ success: true, user });
});

export default router;