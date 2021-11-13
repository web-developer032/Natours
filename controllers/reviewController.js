const Review = require("../models/reviewModel.js");
const factory = require("../controllers/handlerFactory");
// const utils = require("../utils/utils.js");
// const catchAsync = require("../utils/catchAsync");

// exports.createReview = catchAsync(async (req, res, next) => {
//   // const data = { ...req.body, tour: req.params.tourId, user: req.user.id };

//   // NESTED ROUTES (REVIEWS)
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user.id;

//   const review = await Review.create(req.body);

//   res.status(201).json({
//     status: "Success",
//     data: {
//       review,
//     },
//   });
// });

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);

//   res.json({
//     status: "Success",
//     result: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

// exports.getReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findById(req.id);

//   res.json({
//     status: "Success",
//     data: {
//       review,
//     },
//   });
// });

// -------------------------------------------
// MAKING CODE ADVANCE USING FACTORY FUNCTIONS
// -------------------------------------------

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
