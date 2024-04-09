
const pgp = require("pg-promise")();

const courseSchema = new pgp.helpers.ColumnSet(
  ["coursename", "price", "coursedescription", "category", "level", "popularity"],
  { table: "course" }
);

module.exports = courseSchema;
