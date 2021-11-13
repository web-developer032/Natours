const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const User = require("../models/userModel");
const Email = require("../utils/email");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const utils = require("../utils/utils");
const userController = require("./userController");

const createToken = (id) =>
  jwt.sign(
    { id }, // PAYLOAD
    process.env.JWT_SECRET, // SECRET
    // OPTIONS FOR LOGIN
    {
      expiresIn: process.env.JWT_EXPIRE_TIME,
    }
  );

const createAndSendToken = (user, statusCode, res) => {
  const token = createToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_TIME * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // this means cookie cannot be modified or accessed by the browser
    // secure: true, // this means cookie will only be used on HTTPS connection not on HTTP
  };

  // if(process.env.NODE_ENV === "PRODUCTION") cookieOptions.secure = true // this means cookie will only be used on HTTPS connection not on HTTP

  res.cookie("jwt", token, cookieOptions);

  // WE DON'T WANT THE USER TO SEE THE PASSWORD
  user.password = undefined;

  res.status(statusCode).json({
    status: "Success",
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  let updatedUser;
  if (req.file) {
    req.file.filename = `user-${newUser._id}-${Date.now()}.jpeg`;
    await userController.resizeFunction(req);

    updatedUser = await User.findByIdAndUpdate(
      newUser.id,
      {
        photo: req.file.filename,
      },
      {
        new: true, // this means return new object
        runValidators: true,
      }
    );
  }

  console.log("UPDATED USER:", updatedUser);

  const url = `${req.protocol}://${req.get("host")}/me`;

  await new Email(updatedUser, url).sendWelcome();

  createAndSendToken(updatedUser, 201, res);

  // ---------------------------------------------
  // let userData = utils.filterObj(
  //   req.body,
  //   "name",
  //   "email",
  //   "photo",
  //   "password",
  //   "confirmPassword"
  // );

  // const newUser = await User.create(userData);
  // const url = `${req.protocol}://${req.get("host")}/me`;

  // await new Email(newUser, url).sendWelcome();

  // createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) CHECK IF EMAIL AND PASSWORD EXISTS
  if (!email || !password)
    return next(new AppError("Email and Password is required!", 400));

  // 2) CHECK IF USER EXISTS AND PASSWORD IS CORRECT
  const user = await User.findOne({ email }).select("+password");
  const userChecked = await user?.checkPassword(password, user.password);

  if (!user || !userChecked)
    return next(new AppError("Email or Password is wrong!", 401));

  // 3) CHECK IF EXERYTHING IS CORRECT, SEND THE TOKEN
  createAndSendToken(user, 200, res);
});

// ONLY FOR RENDER PAGES, NO ERRORS STUFF
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // 1) VERIFY TOKEN
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) CHECK IF USER STILL EXISTS
      const user = await User.findById(decoded.id);

      if (!user) return next();

      // 3) CHECK IF USER CHANGED PASSWORD AFTER TOKEN WAS ISSUED
      if (user.changedPassword(decoded.iat)) return next();

      // THERE IS A LOGGED IN USER
      res.locals.user = user; // res.locals.user allow us to access user variable in pug templates
    }
    return next();
  } catch {
    next();
  }
};

exports.logout = (req, res, next) => {
  res.clearCookie("jwt");
  res.cookie("jwt", " ", {
    maxAge: 1,
  });

  res.locals.user = null; // res.locals.user allow us to access user variable in pug templates
  req.user = null;
  res.json({ status: "Success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) CHECK TOKEN IF IT EXISTS
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;

  if (!token) return next(new AppError("Please Login First.", 401));

  // 2) VERIFY TOKEN
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded); // WILL PRINT THE ID OF DOCUMENT

  // 3) CHECK IF USER STILL EXISTS
  const user = await User.findById(decoded.id);

  if (!user)
    return next(
      new AppError("User belonging to this token no longer exists.", 401)
    );

  // 4) CHECK IF USER CHANGED PASSWORD AFTER TOKEN WAS ISSUED
  if (user.changedPassword(decoded.iat))
    return next(
      new AppError("Password changed recently. Please Login again.", 401)
    );

  res.locals.user = user; // res.locals.user allow us to access user variable in pug templates
  req.user = user;

  // GRANT ACCESS TO PROTECTED ROUTE
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ["admin","lead-guide"]
    if (!roles.includes(req.user.role))
      return next(new AppError("Insufficient access!", 403));
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) GET USER USING PROVIDED EMAIL THROUGH POST REQUEST
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError("No user exists with this email.", 404));

  // 2) GENERATE RANDOM TOKEN
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // 3) SEND THAT TOKEN TO PROVIDED EMAIL
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;

    // FIRST STYLE

    // await sendMail({
    //   email: user.email,
    //   subject: `Here is your email token ${resetToken} valid for next 10minutes.`,
    //   message,
    // });

    // NEW STYLE
    await new Email(user, resetURL).sendPasswordReset();

    res.json({
      status: "Success",
      message: "Token sent to email.",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error in sending the email! Try Again.", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) GET USER BASE ON TOKEN
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) IF TOKEN HAS NOT EXPIRED AND THERE IS A USER, SET THE NEW PASSWORD
  if (!user)
    return next(new AppError("Token has been expired or invalid token!", 400));
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 3) UPDATE changedPasswordAt PROPERTY

  // 4) LOG USER IN & SEND JWT TOKEN
  await user.save();

  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) GET USER FROM COLLECTION
  const user = await User.findById(req.user.id).select("+password");

  // 2) CHECK IF ENTERED PASSWORD IS CORRECT
  const userChecked = await user?.checkPassword(
    req.body.currentPassword,
    user.password
  );

  // 3) UPDATE THE PASSWORD
  if (userChecked) {
    user.password = req.body.newPassword;
    user.confirmPassword = req.body.confirmNewPassword;
  } else next(new AppError("Wrong password!", 400));

  // 4) LOG IN THE USER AND SEND JWT TOKEN
  await user.save();

  createAndSendToken(user, 200, res);
});
