const express = require("express");
const bodyParser = require("body-parser");
const pgp = require("pg-promise")();
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const { DB_URI } = process.env;

const db = pgp(DB_URI);

const userRoutes = require("./routes/user");
const superAdminRoutes = require("./routes/superAdmin");
const courseRoutes = require("./routes/course");

app.use(bodyParser.json());

app.use(userRoutes);
app.use(superAdminRoutes);
app.use(courseRoutes);

db.connect()
  .then((obj) => {
    console.log("Connected to PostgreSQL database");
    obj.done();
  })
  .catch((error) => {
    console.error("Error connecting to PostgreSQL database:", error.message);
  });

app.use("/", (req, res) => {
  console.log("Working ");
  console.log('data')
  res.send("WORKING");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
