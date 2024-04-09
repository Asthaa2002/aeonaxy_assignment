const bcrypt = require("bcryptjs");
const pgp = require("pg-promise")();
const db = require("../database/db");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const fetch = require("node-fetch");
const cloudinary = require("cloudinary").v2;
const crypto = require("crypto");

if (!global.fetch) {
  global.fetch = fetch;

  if (!global.Headers) {
    const { Headers } = fetch;
    global.Headers = Headers;
  }
}
const resend = new Resend(process.env.API_KEY);
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});
const userSchemaColumns = [
  "name",
  "email",
  "password",
  "resetPasswordToken",
  "resetPasswordExpires",
];

exports.user_signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill all the required fields!" });
    }

    const existingUser = await db.oneOrNone(
      "SELECT * FROM users WHERE email = $1",
      email
    );

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const hashedPwd = await bcrypt.hash(password, 12);

    const new_user = {
      name,
      email,
      password: hashedPwd,
    };

    const filteredColumns = userSchemaColumns.filter((col) =>
      new_user.hasOwnProperty(col)
    );
    const filteredUserSchema = new pgp.helpers.ColumnSet(filteredColumns, {
      table: "users",
    });

    const query =
      pgp.helpers.insert(new_user, filteredUserSchema) + "RETURNING *";

    const result = await db.one(query);

    const mail = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "kirteeeeesri2002@gmail.com",
      subject: "Signup",
      html: "<p>You have signed up successfully!!</p>",
    });

    console.log(mail);

    res
      .status(201)
      .json({ message: "User created successfully!", result, mail });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.user_login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const findUser = await db.oneOrNone(
      "SELECT * FROM users WHERE email = $1",
      email
    );

    if (!findUser) {
      return res
        .status(404)
        .json({ message: "User not found. Please sign up!" });
    }

    const isMatchPassword = await bcrypt.compare(password, findUser.password);
    if (!isMatchPassword) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign({ email }, "astha_secret_key", {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res
      .status(200)
      .json({ message: "User logged in successfully", email, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.user_forgot_password = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required!" });
    }

    const user = await db.oneOrNone(
      "SELECT * FROM users WHERE email = $1",
      email
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetPasswordToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordExpires = Date.now() + 3600000;

    await db.none(
      "UPDATE users SET resetPasswordToken = $1, resetPasswordExpires = $2 WHERE email = $3",
      [resetPasswordToken, resetPasswordExpires, email]
    );

    const resetLink = `http://google.com/reset-password/${resetPasswordToken}`;
    const mail = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "kirteeeeesri2002@gmail.com",
      subject: "Password reset",

      html: `<p>You are receiving this email because you (or someone else) has requested the reset of the password for your account.</p>
               <p>Please click on the following link, or paste this into your browser to complete the process:</p>
               <p><a href="${resetLink}">${resetLink}</a></p>
               <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
    });

    console.log(mail);

    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.user_profile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { phone_no, gender } = req.body;
    const { originalname: image, path: image_url } = req.file;

    const updateUserQuery = `
        UPDATE users
        SET phone_no = $1, gender = $2, image = $3, image_url = $4
        WHERE id = $5
        RETURNING *;
      `;

    const updatedUser = await db.oneOrNone(updateUserQuery, [
      phone_no,
      gender,
      image,
      image_url,
      id,
    ]);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    cloudinary.uploader.upload(
      image_url,
      { public_id: `user_${id}` },
      function (error, result) {
        if (error) {
          console.error(error);
        } else {
          console.log(result);
        }
      }
    );

    res
      .status(200)
      .json({ message: "User profile updated", user: updatedUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.enrolled_courses = async (req, res) => {
  const { userId, courseId } = req.params;
  try {
    const user = await db.oneOrNone(
      "SELECT * FROM users WHERE id = $1",
      userId
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.courses_enrolled = Array.isArray(user.courses_enrolled) ? user.courses_enrolled : [];

    const course = await db.oneOrNone(
      "SELECT * FROM course WHERE id = $1",
      courseId
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isEnrolled = user.courses_enrolled.some(
      (courses_enrolled) => courses_enrolled.id === course.id
    );

    if (isEnrolled) {
      return res
        .status(400)
        .json({ message: "User is already enrolled in the course" });
    }

    user.courses_enrolled.push({
      id: course.id,
      coursename: course.coursename,
      price: course.price,
      aboutcourse: course.aboutcourse,
      category: course.category,
      level: course.level,
      popularity: course.popularity,
    });

    await db.none("UPDATE users SET courses_enrolled = $1 WHERE id = $2", [
      user.courses_enrolled,
      userId,
    ]);

    const mail = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "kirteeeeesri2002@gmail.com",
      subject: "Enroll in course",
      html: "<p>hello, you have successfully enrolled in the course! </p>",
    });

    console.log(mail);

    res.status(200).json({
      message: "User enrolled in the course successfully",
      user,
      mail,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.fetchEnrolledCourses = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.oneOrNone("SELECT * from users WHERE id = $1", id);
    console.log(user);

    user.courses_enrolled = Array.isArray(user.courses_enrolled) ? user.courses_enrolled : [];

    const courses = user.courses_enrolled
    console.log(user.courses_enrolled)
    res
      .status(200)
      .json({ message: "Enrolled courses are fetched", courses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
}
};
