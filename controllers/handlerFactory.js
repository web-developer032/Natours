const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const APIFeature = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc)
      return next(new AppError("No Document found with the specific ID. "));

    res.status(204).json({
      statsu: "Success",
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //this means return new updated document
      runValidators: true, // validate data everytime it change
    });
    if (!doc) return next(new AppError("Invalid Document ID", 404));

    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) return next(new AppError("Invalid Doc ID", 404));

    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // TWO LINES FOR ALLWOING NESTED ROUTES. GET REVIEWS OF A SPECIFIC TOUR  --- HACK
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeature(Model.find(filter), req.query)
      .filter()
      .sort()
      .limiting()
      .pagination();

    // EXECUTE QUERY
    // const docs = await features.query.explain(); // FOR VIEWING DETAILS ABOUT QUERY
    const docs = await features.query;

    res.status(200).json({
      status: "success",
      results: docs.length,
      data: docs.length === 0 ? "No Docs available" : { docs },
    });
  });
