const stripe = require("stripe").Stripe(process.env.STRIPE_SK);
const factory = require("./handlerFactory");

const Booking = require("../models/bookingModel");
const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) GET TOUR BY ID
  const tour = await Tour.findById(req.params.tourID);

  // 2) CREATE CHECKOUT SESSION
  const session = await stripe.checkout.sessions.create({
    //   INFO ABOUT SESSION
    payment_method_types: ["card"],

    // success_url: `${req.protocol}://${req.get("host")}/?tour=${
    //   req.params.tourID
    // }&user=${req.user.id}&price=${tour.price}`,

    success_url: `${req.protocol}://${req.get("host")}/my-tours`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,

    //   INFO ABOUT PRODUCT
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get("host")}/img/tours/${tour.imageCover}`,
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

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;

//   // if there is nothing then move to next
//   if (!tour && !user && !price) return next();
//   else await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split("?")[0]);
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  let event;
  try {
    // FIRST READ SIGNATURE
    const signature = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    ); // req.body needs to be in raw form
  } catch (err) {
    return res.status(400).send(`WEBHOOK error: ${err.message}`);
  }
  console.log("EVENT TYPE: ", event.type);
  if (event.type === "checkout.session.completed") {
    console.log("IF EVENT RAN");
    console.log(event.data.object);
    createBookingCheckout(event.data.object);
  }

  return res.json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
