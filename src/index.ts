import express, { Request, Response } from "express";
import routes from "./routes";

const app = express();

app.use("/api", routes);

app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .send("Working Days API - GET /api/working-date?days=...&hours=...&date=...");
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "NotFound", message: "Ruta no encontrada" });
});

export default app;
