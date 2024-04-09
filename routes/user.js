const express = require('express')
const userController = require('../controllers/user')
const userAuth = require('../middleware/auth')
const multer = require('multer')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); 
  }
});

const upload = multer({ storage: storage });

const router = express.Router()

router.post('/user/signup', userController.user_signup)
router.get('/user/login', userController.user_login)
router.post('/forgot/password', userController.user_forgot_password)
router.put('/user/profile/:id', upload.single('file'), userController.user_profile)
router.post('/enroll/course/:userId/:courseId', userController.enrolled_courses)
router.get('/view/enrolled/course/:id', userController.fetchEnrolledCourses)


module.exports = router
