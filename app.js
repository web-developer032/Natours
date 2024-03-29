const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");

// PACKAGES FOR SECURITY
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const viewRouter = require("./routes/viewRoutes");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const bookingController = require("./controllers/bookingController");

const app = express();

// IMPLEMENTING CORS SO THAT OTHER WEBSITES CAN USE OUR API
app.use(cors()); // THIS WILL WORK FOR SIMPLE REQUESTS LIKE (GET AND POST) BUT NOT FOR (PATCH, DELETE or PUT). or for cookies

// FOR NON-SIMPLE REQUEST WE USE app.options request.
app.options("*", cors()); // app.options() is just like app.get or post etc.

app.enable("trust proxy");

// GLOBAL MIDDLEWARE: SECURITY HTTP HEADER
// USE HELMET IN THE START OF MIDDLEWARES i.e AS A FIRST MIDDLEWARE
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);
app.use(express.static(`${__dirname}/public`)); // to access files from the server. (STATIC FILES)
app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);

if (process.env.NODE_ENV === "DEVELOPMENT") {
    app.use(morgan("dev"));
}

// GLOBAL MIDDLEWARE: LIMIT REQUEST
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message:
        "Too many requests detected from your IP! Please try again after one hour.",
});

app.use("/api/", limiter);

// WE ARE USING THIS ROUTE HERE BECAUSE WE WANT TO READ BODY IN A RAW FORM NOT IN JSON
// FOR STRIPE PAYMENT
app.post(
    "/webhook-checkout",
    express.raw({ type: "application/json" }),
    bookingController.webhookCheckout
);

app.use(cookieParser()); // TO READ COOKIES SENT FROM CLIENT
// BODYPARSER, READING DATA FROM FRONTEND AND PUTTING IT INTO req.body
app.use(express.json({ limit: "10kb" })); // to use data that is sent by user from front-end. limit the data to 10kb that user can sent.

app.use(express.urlencoded({ extended: true, limit: "10kb" })); // TO USE DATA COMING FROM FRONTEND BY SUBMITTING FORM
// DATA SANITIZATION (CLEARNING) AGAINST NOSQL QUERY
app.use(mongoSanitize()); // IT PREVENT ATTACKS LIKE: { email: {$gt: ""}, password: pass1228}

// DATA SANITIZATION (CLEARNING) AGAINST XSS (CROSS SITE SCRIPTING ATTACK)
app.use(xss());

// AVOIDING PARAMETER POLLUTION
app.use(
    hpp({
        whitelist: [
            "duration",
            "ratingsQuantity",
            "ratingsAverage",
            "maxGroupSize",
            "difficulty",
            "price",
        ], // TELL WHICH PARAMETER WE ARE ALLOWING TO DUPLICATE
    })
);

// USE THIS MIDDLEWARE TO COMPRESS TEXT RESPONSE THAT WE SENT TO CLIENTS
app.use(compression());

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

app.all("*", (req, res, next) => {
    // const err = new Error(`Can't find ${req.originalUrl} on the Server.`);
    // err.status = "failed";
    // err.statusCode = 404;

    // next(err); // if we pass anything to next function express will automatically recognize that there is an error and it will stop execution and just call the global error handling middleware

    next(new AppError(`Can't find ${req.originalUrl} on the Server.`, 404));
});

// Making Error Handling MIddleware.
// if we pass 4 arguments express will automatically recognize it as an error handling middleware
app.use(globalErrorHandler);

module.exports = app;
