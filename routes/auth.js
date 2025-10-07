import express from "express";
import User from "../models/User.js";
import Session from "../models/Session.js";
import Cart from "../models/Cart.js";

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      // token, // Don't send token in response always send it in a cookies.
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { sid: sessionId } = req.signedCookies;
    const session = await Session.findById(sessionId);

    if (session) {
      session.expires = Math.round(Date.now() / 1000) + 60 * 60 * 24 * 30;
      session.userId = user._id;

      // TODO: if user has already have cart then add the cart in previous cart otherwise create new cart.
      // check user cart. if cart exist then add into prev cart else create new one.
      const result = await Cart.create({
        userId: user._id,
        courses: session.data.cart,
      });
      session.data = {};

      console.log({ result });

      await session.save();

      res.cookie("sid", session.id, {
        httpOnly: true,
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });
      return res.json({
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      });
    }

    const newSession = await Session.create({ userId: user.id });

    res.cookie("sid", newSession.id, {
      httpOnly: true,
      signed: true,
      maxAge: 1000 * 60 * 60 * 24,
    });

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Profile route.
router.get("/user", async (req, res) => {
  try {
    const { sid: sessionId } = req.signedCookies;
    const session = await Session.findById(sessionId);

    if (!session.userId) {
      return res.status(404).json({ error: "User not loggedin." });
    }

    const user = await User.findById(session.userId).lean();

    return res.json({
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
