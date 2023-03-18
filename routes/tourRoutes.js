const express = require("express");
const router = express.Router();
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("../routes/reviewRoutes");

// a middleware that will only run if certain parameter is present in the url
// router.param("id", tourController.checkId);

router.use("/:tourId/reviews", reviewRouter);

router.route("/top-5-cheap").get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);
router
    .route("/monthly-plan/:year")
    .get(
        authController.protect,
        authController.restrictTo("admin", "lead-guide", "guide"),
        tourController.getMonthlyPlan
    );

router
    .route("/tours-within/:distance/center/:latlng/unit/:unit")
    .get(tourController.getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router.route("/").get(tourController.getAllTours).post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),

    tourController.createTour
);

router.use(authController.protect, authController.restrictTo("admin", "lead-guide")); // PROTECT ALL THE NEXT ROUTES

router
    .route("/:id")
    .get(tourController.getTour)
    .patch(
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
    )
    .delete(tourController.deleteTour);

// REVIEW ROUTE
// router
//   .route("/:tourId/reviews")
//   .get(reviewController.getAllReviews)
//   .post(
// authController.protect,
// authController.restrictTo("user"),
//     reviewController.createReview
//   );

module.exports = router;
