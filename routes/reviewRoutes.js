const express = require("express");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const router = express.Router({ mergeParams: true }); // mergeParams merge passed parameters in the url and link all those to current req

router.use(authController.protect); // PROTECT ALL THE NEXT ROUTES

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("admin", "user"),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo("admin", "user"),
    reviewController.deleteReview
  );

module.exports = router;