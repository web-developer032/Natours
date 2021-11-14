const express = require("express");
const router = express.Router();
const viewsController = require("../controllers/viewsController");
const authController = require("../controllers/authController");
const bookingController = require("../controllers/bookingController");

router.get("/me", authController.protect, viewsController.me);

router.use(authController.isLoggedIn);
router.get(
  "/",
  // bookingController.createBookingCheckout,
  viewsController.getOverview
);
router.get("/login", viewsController.getLoginForm);
router.get("/signup", viewsController.getSignupForm);
router.get("/tour/:slug", viewsController.getTour);
router.get("/my-tours", authController.protect, viewsController.getMyTours);

module.exports = router;
