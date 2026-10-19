import { sql } from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        error: "Name must be between 2 and 100 characters.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    if (password.length < 12 || password.length > 72) {
      return res.status(400).json({
        error: "Password must be between 12 and 72 characters.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const users = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${cleanName}, ${cleanEmail}, ${passwordHash}, 'analyst')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email, role, created_at
    `;

    if (users.length === 0) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    return res.status(201).json({
      message: "Account created successfully. Please log in.",
      user: users[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const users = await sql`
      SELECT id, name, email, password_hash, role
      FROM users
      WHERE email = ${email.trim().toLowerCase()}
      LIMIT 1
    `;

    if (
      users.length === 0 ||
      !(await bcrypt.compare(password, users[0].password_hash))
    ) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const user = users[0];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        error: "Authentication is not configured.",
      });
    }

    const token = jwt.sign(
      { role: user.role },
      secret,
      {
        subject: String(user.id),
        expiresIn: "2h",
        algorithm: "HS256",
      }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}