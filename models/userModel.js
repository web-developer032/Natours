const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please tell your user name."],
        min: [3, "Name must be atleast 3 characters."],
        max: [3, "Name must be less than or equal to 15 characters."],
    },

    email: {
        type: String,
        unique: true,
        lowercase: true,
        required: [true, "Please provide your email."],
        validate: [validator.isEmail, "Incorrect email!"],
    },

    role: {
        type: String,
        enum: ["user", "guide", "lead-guide", "admin"],
        default: "user",
    },

    password: {
        type: String,
        required: [true, "Please enter your password."],
        min: [6, "Password must be atleast 6 characters."],
        select: false,
    },

    confirmPassword: {
        type: String,
        required: [true, "Please confirm your password."],
        validate: {
            // THIS ONLY WORKS ON SAVE & CREATE DOCUMENT
            validator: function (val) {
                return this.password === val;
            },
            message: "Password not match",
        },
    },

    photo: { type: String, default: "default.jpg" },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
        this.confirmPassword = undefined; // WE DON'T WANT TO STORE CONFIRM-PASSWORD ON THE DATABASE
    }
    next();
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 5000;
    next();
});

userSchema.methods.checkPassword = async (password, dbPassword) =>
    await bcrypt.compare(password, dbPassword);

userSchema.methods.changedPassword = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimeStamp < changedTimeStamp;
    }

    return false; // MEANS PASSWORD NOT CHANGED.
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Query Middleware
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
