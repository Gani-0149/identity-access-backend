import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/user/:address/role", (_req, res) => {
  res.json({ role: "USER" });
});

export default router;