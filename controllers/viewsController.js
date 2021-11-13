const Tour = require("../models/tourModel");
const Booking = require("../models/bookingModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) GET TOURS DATA FROM COLLECTION
  const tours = await Tour.find();

  // 2) BUILD TEMPLATE & RENDER THE TEMPLATE
  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) GET DATA FOR THE TOUR (INCLUDE REVIEWS AND TOUR GUIDES)

  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review user rating",
  });

  if (!tour) return next(new AppError("No Document Found", 404));

  // 2) BUILD TEMPLATE AND RENDER
  res.render("tour", {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) =>
  res.render("login", { title: "Login to Natours" });

exports.getSignupForm = (req, res) =>
  res.status(200).render("signup", { title: "Signup to Natours" });

exports.me = (req, res) => {
  res.render("account", {
    title: "Your Account",
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // FIND ALL BOOKINGS
  const bookings = await Booking.find({
    user: req.user.id,
  });

  // FIND TOURS WITH RETURNED BOOKINGS
  const tourIDs = bookings.map((doc) => doc.tour);

  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.render("overview", {
    title: "My Tours",
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true, // return new document =  true
      runValidator: true, // check data again?
    }
  );

  res.locals.user = user;
  req.user = user;
  res.render("account", {
    title: "Your Account",
  });
});
