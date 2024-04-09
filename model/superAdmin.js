const pgp = require('pg-promise')();

const superAdminSchema = new pgp.helpers.ColumnSet([
  'name',
  'email',
  'password'
], { table: 'superadmin' });

module.exports = superAdminSchema;
