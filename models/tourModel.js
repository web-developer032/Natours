const mongoose = require("mongoose");
const slugify = require("slugify");
// const User = require("./userModel");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,

      // mongoose builtin validators
      required: [true, "A tour must have a name"],
      maxLength: [40, "A tour must have less than or equal to 40 characters"],
      minLength: [8, "A tour must have greater or equal to 5 characters"],
    },

    description: {
      type: String,
      required: [true, "A tour must have a description"],
      trim: true,
    },

    summary: {
      type: String,
      required: [true, "A tour must have a summary"],
      trim: true,
    },

    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },

    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a maximum group size"],
    },

    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty must be easy, medium or difficult",
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1"],
      max: [5, "Rating must be below 5"],
      set: (val) => Math.random(val * 10) / 10, // 4.666 => 46.666 => 47 => 4.7
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },

    priceDiscount: {
      type: Number,

      // custom validator only run when you create document not on update
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "Discount must be greater than price",
      },
    },

    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // this tells that don't show this property when user request to show data
    },

    startDates: [Date],

    slug: String,

    secretTour: {
      type: Boolean,
      default: false,
      select: false, // this tells that don't show this property when user request to show data
    },

    // GeoJSON
    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    // guides: Array, // FOR EMBEDING DOCUMENTS
    // ['ADHAHDjkhJADHkjahdkajhskkajhskd', 'ASDasdASDasdadadASDASD']

    // FOR DOCUMENT REFRENCING
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    // when output document then show virtuals properties
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEX TO MAKE QUERY SEARCH BETTER PERFORMACE
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

// VIRTUAL FIELD
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// VIRTUAL POPULATE
tourSchema.virtual("reviews", {
  ref: "Review", // MODAL NAME
  foreignField: "tour", // WHICH FIELD IT SHOULD LOOK FOR
  localField: "_id", // WHAT SHOULD BE THAT FIELD VALUE
});

// -------------------------
// DOCUMENT MIDDLEWARE:
// -------------------------

// This will run for every .save() and .create() but not for .insertMany() or .insertOne() or find() or findById etc
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// EMBEDDING USER DOCUMENT INTO TOUR DOCUMENT
// tourSchema.post("save", async function (doc, next) {
//   this.guide = await Promise.all(
//     this.guides.map(async (id) => await User.findById(id))
//   );

//   next();
// });

// -------------------------
// QUERY MIDDLEWARE
// -------------------------

// tourSchema.pre("find", function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// GET DATA OF REFERENCED DOCUMENTS
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt -passwordResetToken -passwordResetExpires",
  });
  next();
});

// tourSchema.post(/^find/, function (doc, next) {
//   console.log(`Query took ${(Date.now() - this.start) / 1000} seconds `);
//   next();
// });

// -------------------------
// AGGREGATION MIDDLEWARE:
// -------------------------
// tourSchema.pre("aggregate", function (next) {
//   // we don't want to match secret tour
//   // this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
