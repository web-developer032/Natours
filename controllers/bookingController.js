const stripe = require("stripe").Stripe(process.env.STRIPE_SK);
const factory = require("./handlerFactory");

const Booking = require("../models/bookingModel");
const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) GET TOUR BY ID
  const tour = await Tour.findById(req.params.tourID);

  // 2) CREATE CHECKOUT SESSION
  const session = await stripe.checkout.sessions.create({
    //   INFO ABOUT SESSION
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/?tour=${
      req.params.tourID
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,

    //   INFO ABOUT PRODUCT
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          "https://www.google.com/url?sa=i&url=https%3A%2F%2Funsplash.com%2Fs%2Fphotos%2Fphotographer&psig=AOvVaw39fAB1uf0LACqH1HnSmxyQ&ust=1636472922652000&source=images&cd=vfe&ved=0CAsQjRxqFwoTCPCS6OuOifQCFQAAAAAdAAAAABAD",
        ],
        amount: tour.price * 100,
        currency: "usd",
        quantity: 1,
      },
    ],
  });

  // 3) CREATE SESSION AND RESPONSE
  res.json({
    status: "Success",
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  // if there is nothing then move to next
  if (!tour && !user && !price) return next();
  else await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split("?")[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
