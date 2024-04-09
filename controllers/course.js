const db = require("../database/db");
const courseSchema = require("../model/course");
const pgp = require("pg-promise")();
exports.create_course = async (req, res) => {
    try {
      const { coursename, price, coursedescription, category, level, popularity } =
        req.body;
  
      const findCourse = await db.oneOrNone(
        "SELECT * FROM course WHERE coursename = $1",
        [coursename]
      );
      if (findCourse) {
        return res
          .status(400)
          .json({ message: "Course already added in the database" });
      }
  
      const newCourse =
        pgp.helpers.insert(
          {
            coursename,
            price,
            coursedescription,
            category,
            level,
            popularity,
          },
          courseSchema
        ) + " RETURNING *";
  
      const result = await db.one(newCourse);
  
      res.status(201).json({ message: "This Course is added to the database!", result });
    } catch (error) {
      console.error("Error adding course:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

exports.retrieve_courses = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 3;
      const offset = (page - 1) * limit;
  
      const query = `
        SELECT * FROM course
        LIMIT $1
        OFFSET $2
      `;
  
      const courses = await db.any(query, [limit, offset]);
  
      if (courses.length === 0) {
        return res
          .status(404)
          .json({ message: "No courses found in the database!!" });
      }
  
      const totalCountQuery = "SELECT COUNT(*) FROM course";
      const totalCount = await db.one(totalCountQuery, [], (data) => +data.count);
  
      const totalPages = Math.ceil(totalCount / limit);
  
      const pagination = {
        currentPage: page,
        pageSize: limit,
        totalCount: totalCount,
        totalPages: totalPages,
      };
  
      if (page < totalPages) {
        pagination.nextPage = `/get/course?page=${page + 1}&limit=${limit}`;
      }
  
      if (page > 1) {
        pagination.prevPage = `/get/course?page=${page - 1}&limit=${limit}`;
      }
  
      res.status(200).json({
        message: "Courses fetched from the database",
        courses: courses,
        pagination: pagination,
      });
    } catch (err) {
      console.error("Error fetching courses:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
  exports. update_course = async (req, res) => {
    const { id } = req.params;
    try {
      const { coursename, price, coursedescription, category, level, popularity } =
        req.body;
  
      if (!id) {
        return res.status(400).json({ message: "No course with this id is found!!" });
      }
  
      const existingCourse = await db.oneOrNone(
        "SELECT * FROM course WHERE id = $1",
        [id]
      );
      if (!existingCourse) {
        return res.status(404).json({ message: "No Course found" });
      }
  
      await db.none(
        "UPDATE course SET coursename = $1, price = $2, coursedescription = $3, category = $4, level = $5, popularity = $6 WHERE id = $7",
        [coursename, price, coursedescription, category, level, popularity, id]
      );
  
      res.status(200).json({ message: "Course updated successfully" });
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  exports.delete_course_by_id = async (req, res) => {
    const { id } = req.params;
    try {
      const findCourse = await db.oneOrNone(
        "SELECT * FROM course WHERE id = $1",
        id
      );
      if (!findCourse) {
        return res
          .status(404)
          .json({ message: "Course not found in the database" });
      }
  
      await db.none("DELETE FROM course WHERE id = $1", id);
  
      res.status(200).json({ message: "Course deleted successfully" });
    } catch (err) {
      console.error("Error deleting course:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  exports.delete_courses = async (req, res) => {
    try {
      const findCourse = await db.any("SELECT * FROM course");
      if (!findCourse) {
        return res.status(404).json({ message: "No course is found in the database" });
      }
  
      await db.none("DELETE FROM course");
  
      res.status(200).json({ message: "All Courses deleted successfully" });
    } catch (err) {
      console.error("Error deleting course:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  exports. get_courses_by_category = async (req, res) => {
    try {
      const { category } = req.query;
  
      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }
  
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 2;
      const offset = (page - 1) * limit;
  
      const query = `
        SELECT * FROM course 
        WHERE category = $1
        LIMIT $2
        OFFSET $3
      `;
  
      const findCourse = await db.any(query, [category, limit, offset]);
  
      if (findCourse.length === 0) {
        return res
          .status(404)
          .json({ message: "No courses found in this category" });
      }
  
      const totalCountQuery = "SELECT COUNT(*) FROM course WHERE category = $1";
      const totalCount = await db.one(
        totalCountQuery,
        category,
        (data) => +data.count
      );
  
      const totalPages = Math.ceil(totalCount / limit);
  
      const pagination = {
        currentPage: page,
        pageSize: limit,
        totalCount: totalCount,
        totalPages: totalPages,
      };
  
      if (page < totalPages) {
        pagination.nextPage = `/get/course/by/category?category=${category}&page=${
          page + 1
        }&limit=${limit}`;
      }
  
      if (page > 1) {
        pagination.prevPage = `/get/course/by/category?category=${category}&page=${
          page - 1
        }&limit=${limit}`;
      }
  
      res.status(200).json({
        message: "Courses fetched by category successfully",
        courses: findCourse,
        pagination: pagination,
      });
    } catch (err) {
      console.error("Error fetching courses by category:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  exports.get_course_by_level = async (req, res) => {
    try {
      const { level } = req.query;
  
      if (!level) {
        return res.status(400).json({ message: "level is required" });
      }
  
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 2;
      const offset = (page - 1) * limit;
  
      const query = `
        SELECT * FROM course 
        WHERE level = $1
        LIMIT $2
        OFFSET $3
      `;
  
      const findCourse = await db.any(query, [level, limit, offset]);
  
      if (findCourse.length === 0) {
        return res
          .status(404)
          .json({ message: "No course found with this level" });
      }
  
      const totalCountQuery = "SELECT COUNT(*) FROM course WHERE level = $1";
      const totalCount = await db.one(
        totalCountQuery,
        level,
        (data) => +data.count
      );
  
      const totalPages = Math.ceil(totalCount / limit);
  
      const pagination = {
        currentPage: page,
        pageSize: limit,
        totalCount: totalCount,
        totalPages: totalPages,
      };
  
      if (page < totalPages) {
        pagination.nextPage = `/get/course/by/level?level=${level}&page=${
          page + 1
        }&limit=${limit}`;
      }
  
      if (page > 1) {
        pagination.prevPage = `/get/course/by/level?level=${level}&page=${
          page - 1
        }&limit=${limit}`;
      }
  
      res.status(200).json({
        message: "Courses fetched by level successfully",
        courses: findCourse,
        pagination: pagination,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  exports.get_course_by_popularity = async (req, res) => {
    try {
      const { popularity } = req.query;
  
      if (!popularity) {
        return res.status(400).json({ message: "popularity is required" });
      }
  
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const offset = (page - 1) * limit;
  
      const query = `
        SELECT * FROM course 
        WHERE popularity = $1
        LIMIT $2
        OFFSET $3
      `;
  
      const findCourse = await db.any(query, [popularity, limit, offset]);
  
      if (findCourse.length === 0) {
        return res
          .status(404)
          .json({ message: "No course found with this popularity" });
      }
  
      const totalCountQuery = "SELECT COUNT(*) FROM course WHERE popularity = $1";
      const totalCount = await db.one(
        totalCountQuery,
        popularity,
        (data) => +data.count
      );
  
      const totalPages = Math.ceil(totalCount / limit);
  
      const pagination = {
        currentPage: page,
        pageSize: limit,
        totalCount: totalCount,
        totalPages: totalPages,
      };
  
      if (page < totalPages) {
        pagination.nextPage = `/get/course/by/popularity?popularity=${popularity}&page=${
          page + 1
        }&limit=${limit}`;
      }
  
      if (page > 1) {
        pagination.prevPage = `/get/course/by/popularity?popularity=${popularity}&page=${
          page - 1
        }&limit=${limit}`;
      }
  
      res.status(200).json({
        message: "Courses fetched by popularity successfully",
        courses: findCourse,
        pagination: pagination,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };