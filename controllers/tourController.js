const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("../controllers/handlerFactory");
const AppError = require("../utils/appError");
const multer = require("multer");
const sharp = require("sharp");
// const APIFeature = require("../utils/apiFeatures");

// FOR STORRING FILE ON MEMORY
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Invalid File, Please upload Image.", 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// upload.single(fileName) // FOR UPLOADING SINGLE FILE. IT PRODUCES req.file
// upload.array(fileName,maxCount) // FOR UPLOADING MULTIPLE FILE. IT PRODUCES req.files
// upload.fields([{fileName,maxCount},{fileName,maxCount}]) // FOR UPLOADING MULTIPLE FILEDS with files. IT PRODUCES req.files

exports.uploadTourImages = upload.fields([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 3,
  },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) imageCover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-Cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 1) images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);

      req.body.images.push(fileName);
    })
  );

  return next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,difficulty,price,summary,ratingsAverage";

  next();
};

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   const features = new APIFeature(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limiting()
//     .pagination();

//   // EXECUTE QUERY
//   const tours = await features.query;

//   res.status(200).json({
//     status: "success",
//     results: tours.length,
//     data: tours.length === 0 ? "No tours available" : { tours },
//   });
// });

// exports.getTour = catchAsync(async (req, res, next) => {
//   // const tour = await Tour.findById(req.params.id); // Simple ID

//   // if we have references in our Document then inorder to fill them by data use this populate
//   // const tour = await Tour.findById(req.params.id).populate("guides");

//   // if you want to populate data by some specific fields. but we have done it in query middleware so that it can run for every tour find
//   const tour = await Tour.findById(req.params.id).populate({ path: "reviews" }); //.populate({ path: "guides",select: "-__v -passwordChangedAt -passwordResetToken -passwordResetExpires", });

//   if (!tour) return next(new AppError("Invalid Tour ID", 404));

//   res.status(200).json({
//     status: "success",
//     data: {
//       tour,
//     },
//   });
// });

// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: "success",
//     data: {
//       tour: newTour,
//     },
//   });
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true, //this means return new updated document
//     runValidators: true, // validate data everytime it change
//   });
//   if (!tour) return next(new AppError("Invalid Tour ID", 404));

//   res.status(200).json({
//     status: "success",
//     data: {
//       tour,
//     },
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) return next(new AppError("Invalid Tour ID", 404));

//   res.status(204).json({
//     status: "success",
//     data: null,
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: null,
        _id: { $toUpper: "$difficulty" },
        totalTours: { $sum: 1 },
        numRating: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        maxPrice: { $max: "$price" },
        minPrice: { $min: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },

    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        // _id: null,
        _id: { $month: "$startDates" },
        totalTours: { $sum: 1 },
        tours: {
          $push: "$name",
        },
      },
    },
    {
      $sort: {
        totalTours: -1,
      },
    },
    {
      $addFields: {
        month: "$_id",
      },
    },
    {
      // this is used to exclude field from the output
      $project: {
        _id: 0,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

// "/tours-within/:distance/center/:latlng/unit/:unit"
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  if (!latlng || !lng || !lat)
    return next(
      new AppError(
        "Please provide Latitude and Longitude in format like this lat,lng ",
        400
      )
    );
  let EarthRadiusInMiles = 3963.2;
  let EarthRadiusInKilometers = 6378.1;

  // INORDER TO GET RADIUS IN RADIANS WE NEED TO DIVIDE DISTANCE BY RADIUS OF EARTH
  let radius =
    unit === "mi"
      ? distance / EarthRadiusInMiles
      : distance / EarthRadiusInKilometers;

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius], // MongoDB accept radius in radians
      },
    },
  });

  res.json({
    status: "Success",
    results: tours.length,
    data: tours,
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;
  if (!latlng || !lng || !lat)
    return next(
      new AppError(
        "Please provide Latitude and Longitude in format like this lat,lng ",
        400
      )
    );

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.json({
    status: "Success",
    // results: distances.length,
    data: distances,
  });
});

// -------------------------------------------
// MAKING CODE ADVANCE USING FACTORY FUNCTIONS
// -------------------------------------------

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: "reviews", select: "-__v" });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
