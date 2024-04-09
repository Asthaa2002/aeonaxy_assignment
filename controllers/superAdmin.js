const superAdminSchema = require("../model/superAdmin");
const bcrypt = require("bcryptjs");
const pgp = require("pg-promise")();
const db = require("../database/db");
const jwt = require("jsonwebtoken");

  exports.super_admin_signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "fill all the required entries!!" });
    }

    const existingAdmin = await db.oneOrNone(
      "SELECT * FROM superadmin WHERE email = $1",
      email
    );
    if (existingAdmin) {
      return res.status(400).json({ message: " this Admin already exist" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const hashedPwd = await bcrypt.hash(password, 12);

    const query =
      pgp.helpers.insert(
        { name, email, password: hashedPwd },
        superAdminSchema
      ) + "RETURNING *";

    const result = await db.one(query);

    res
      .status(201)
      .json({ message: "Superadmin created successfully!", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.super_admin_login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const findAdmin = await db.oneOrNone(
        "SELECT * FROM superadmin WHERE email = $1",
        email
      );
  
      if (!findAdmin) {
        return res
          .status(404)
          .json({ message: "Admin not found! Please sign up!" });
      }
  
      const isMatchPassword = await bcrypt.compare(password, findAdmin.password);
      if (!isMatchPassword) {
        return res.status(401).json({ message: "Incorrect password" });
      }
  
      const token = jwt.sign({ email }, "astha_secret_key", {
        expiresIn: 3600,
      });
  
      res
        .status(200)
        .json({ message: "Admin  is logged in successfully!!!", email, token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
  