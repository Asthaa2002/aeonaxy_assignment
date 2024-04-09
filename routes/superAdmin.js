const express = require('express')
const superAdminController = require('../controllers/superAdmin')

const router = express.Router();

router.post('/super_admin/signup', superAdminController.super_admin_signup);
router.post('/super_admin/login', superAdminController.super_admin_login);


module.exports = router
