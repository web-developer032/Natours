const mongoose = require("mongoose");
const fs = require("fs");
const dotenv = require("dotenv"); // module to use environment file

const Tour = require("../../models/tourModel");
const User = require("../../models/userModel");
const Review = require("../../models/reviewModel");

dotenv.config({ path: "./config.env" });

mongoose
  .connect(
    "mongodb+srv://mubasher:1122@natours-cluster-0.82xyt.mongodb.net/Natours?retryWrites=true&w=majority"
    // process.env.DATABASE_OFFLINE

    // options
    // , { useNewUrlParser: true, useCreateIndex: true, useFindAndModify:false, }
  )
  .then((con) => {
    console.log("Database Connection Successfull");
    importData();
  });
// mongoose.connect(process.env.DATABASE_ONLINE).then((con) => {
//   console.log("Database Connection Successfull");
//   importData();
// });

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);

    console.log("Loaded Data Successfully");
  } catch (error) {
    console.log(error);
  }
};
