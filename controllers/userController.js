const multer = require("multer");
const sharp = require("sharp");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const utils = require("../utils/utils");
const User = require("../models/userModel");
const factory = require("../controllers/handlerFactory");

// FOR STORRING FILE ON DISK
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// FOR STORRING FILE ON MEMORY
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Invalid File, Please upload Image.", 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.resizeFunction = async (req) => {
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
};

exports.uploadUserPhoto = upload.single("photo"); // UPLOAD SINGLE FILE
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await this.resizeFunction(req);
  // BUFFER METHOD AVAILABLE WHEN STORING ON RAM
  // await sharp(req.file.buffer)
  //   .resize(500, 500)
  //   .toFormat("jpeg")
  //   .jpeg({ quality: 90 })
  //   .toFile(`public/img/users/${req.file.filename}`);

  return next();
});

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: "success",
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) IF USER TRIED TO UPDATE PASSWORD SEND ERROR!
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError(
        "This route is not for Password updating. Inorder to update password use this route updatePassword",
        400
      )
    );

  // 2) Filter DATA
  const filteredBody = utils.filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) UPDATE USER DATA
  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // this means return new object
    runValidators: true,
  });

  res.json({
    status: "Success",
    data: {
      user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "Success",
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// exports.getUser = catchAsync(async (req, res, next) => {
//   res.status(500).json({
//     status: "error",
//     message: "route not defined yet.",
//   });
// });

// exports.updateUser = catchAsync(async (req, res, next) => {
//   res.status(500).json({
//     status: "error",
//     message: "route not defined yet.",
//   });
// });

// exports.deleteUser = catchAsync(async (req, res, next) => {
//   res.status(500).json({
//     status: "error",
//     message: "route not defined yet.",
//   });
// });

// -------------------------------------------
// MAKING CODE ADVANCE USING FACTORY FUNCTIONS
// -------------------------------------------

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.createUser = factory.createOne(User); // DON'T UPDATE PASSWORD USING THIS FUNCTION.
exports.updateUser = factory.updateOne(User); // DON'T UPDATE PASSWORD USING THIS FUNCTION.
exports.deleteUser = factory.deleteOne(User);
