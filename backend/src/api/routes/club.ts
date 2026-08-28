import { Router } from "express";
import * as db from "../../init/db";

const router = Router();

router.get("/lessons", async (req, res) => {
  try {
    const result = await db.getPool()?.query(
      "SELECT level, name, text FROM club_lessons ORDER BY level ASC"
    );
    if (!result || !result.rows) {
      return res.status(500).json({ message: "Database error" });
    }
    return res.json({ message: "Success", data: result.rows });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
