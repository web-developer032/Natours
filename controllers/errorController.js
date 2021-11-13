const AppError = require("../utils/appError");

const handleDBCastError = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleDBValidationError = (error) => {
  const errors = Object.values(error.errors).map((el) => el.message);
  const message = `Invalid data: ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleDBDuplicateFieldsError = (error) => {
  // const value = error.errmsg.match(/(["'])(\\?.)*?\1/);

  let key;
  for (const k in error.keyValue) {
    key = k;
    break;
  }

  const value = error.keyValue[key];
  const message = `Duplicate field value: ${value}. Please try another ${key}! `;
  return new AppError(message, 400);
};

// DURING DEVELOPMENT WE NEED INFO ABOUT ERROR TO SOLVE IT
const sendDevErr = (err, req, res) => {
  // 1) Log Error
  console.error("Error 🤦‍♂️", err);

  // API ERROR
  if (req.originalUrl.startsWith("/api")) {
    // OPERATION ERROR (ERRORS GENERATE BY US)
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });

    // OTHER ERROR
  }
  // UNKOWN OR PROGRAMMING ERROR THAT WE DON'T KNOW (THIRD PARTY ERROR)
  return res.status(err.statusCode).render("error", {
    title: "Something Went Wrong",
    msg: err.message,
  });
};

// CLIENT DON'T NEED MUCH INFO. SO SEND SIMPLE INFO ABOUT ERROR
const sendProdErr = (err, req, res) => {
  // OPERATION ERROR (ERRORS GENERATE BY US)
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // UNKOWN OR PROGRAMMING ERROR THAT WE DON'T KNOW (THIRD PARTY ERROR)
    // 1) Log Error
    console.error("Error 🤦‍♂️", err);

    // 2) Send Simple Message
    return res.status(500).json({
      status: "Error",
      message: "Something went wrong!",
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something Went Wrong",
      msg: err.message,
    });
  }
  // UNKOWN OR PROGRAMMING ERROR THAT WE DON'T KNOW (THIRD PARTY ERROR)

  // 1) Log Error
  console.error("Error 🤦‍♂️", err);

  // 2) Send Simple Message
  return res.status(500).render("error", {
    title: "Error",
    msg: "Something went wrong!",
  });
};

const handleJWTError = () =>
  new AppError("Invalid or Expired Token. Please Login again.", 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "DEVELOPMENT") {
    sendDevErr(err, req, res);
  } else {
    let error = err;

    if (error.name === "CastError") error = handleDBCastError(error);
    if (error.name === "ValidationError")
      error = handleDBValidationError(error);
    if (error.code === 11000) error = handleDBDuplicateFieldsError(error);
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    )
      error = handleJWTError();
    sendProdErr(error, req, res);
  }
};
