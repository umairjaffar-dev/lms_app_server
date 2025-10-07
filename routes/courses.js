import express from "express";
import Course from "../models/Course.js";
import Session from "../models/Session.js";

const router = express.Router();

// GET all courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();

    // Search for previos session in database.
    const prevSession = await Session.findById(req.signedCookies.sid);

    if (!prevSession) {
      // Create session for courses:
      const session = await Session.create({});

      res.cookie("sid", session.id, {
        httpOnly: true,
        signed: true,
        maxAge: 1000 * 60 * 60 * 24,
      });
    }

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
