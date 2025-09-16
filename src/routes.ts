import { Router } from "express";
import { calcularFechaController } from "./controllers/dateController";

const router: Router = Router();

router.get("/working-date", calcularFechaController);

export default router;
