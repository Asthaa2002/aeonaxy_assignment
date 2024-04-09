const pgp = require('pg-promise')();

const userSchema = new pgp.helpers.ColumnSet([
  'name',
  'email',
  'password',
  'image',
  'image_url',
  'phone_no',
  'gender',
  'courses_enrolled'
], { table: 'users' });

module.exports = userSchema;
