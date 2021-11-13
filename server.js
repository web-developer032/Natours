const mongoose = require("mongoose");
const dotenv = require("dotenv"); // module to use environment file

// IT SHOULD BE ON TOP SO THAT WE CATCH EVERY ERROR
// SOLVING UNCAUGHT EXCEPTION (for example a variable that is undefined)
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION. Shutting Down! 🤦‍♂️");
  console.log(err.name, err.message);
  console.log(err);
  // 0 for success
  // 1 for uncaught exception
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

mongoose
  .connect(
    process.env.DATABASE_ONLINE
    // process.env.DATABASE_OFFLINE

    // options
    // , { useNewUrlParser: true, useCreateIndex: true, useFindAndModify:false, }
  )
  .then((con) => {
    console.log("Database Connection Successfull");
  });
// .catch((err) => {
//   console.log("Database Connection failed");
// });

let port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log("Listening at port: ", port);
});

// SOLVING UNHANDLED REJECTION (catch promise rejections etc)
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION. Shutting Down! 🤦‍♂️");
  console.log(err.name, err.message);
  console.log(err);
  server.close(() => {
    // 0 for success
    // 1 for uncaught exception
    process.exit(1);
  });
});
