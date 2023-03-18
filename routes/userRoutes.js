const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

router.post("/signup", userController.uploadUserPhoto, authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.patch("/resetPassword/:token", authController.resetPassword);
router.post("/forgotPassword", authController.forgotPassword);

router.use(authController.protect); // PROTECT ALL THE NEXT ROUTES
router.get("/me", userController.getMe, userController.getUser);
router.patch(
    "/updateMe",
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
);
router.patch("/updatePassword", authController.updatePassword);
router.delete("/deleteMe", userController.deleteMe);

router.use(authController.restrictTo("admin")); // PROTECT ALL THE NEXT ROUTES
router.route("/").get(userController.getAllUsers).post(userController.createUser);

router
    .route("/:id")
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;
