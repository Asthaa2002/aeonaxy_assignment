const express = require('express')
const courseController = require('../controllers/course')
const adminAuth = require('../middleware/auth')

const router = express.Router()

router.post('/add/course', adminAuth, courseController.create_course);
router.get('/get/course', adminAuth, courseController.retrieve_courses)
router.put('/update/course/:id', adminAuth, courseController.update_course)
router.delete('/delete/course/:id', adminAuth, courseController.delete_course_by_id);
router.delete('/delete/course', adminAuth, courseController.delete_courses);
router.get('/get/course/by/category', courseController.get_courses_by_category)
router.get('/get/course/by/level', courseController.get_course_by_level);
router.get('/get/course/by/popularity', courseController.get_course_by_popularity)


module.exports = router
