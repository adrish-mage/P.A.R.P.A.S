const mongoose = require("mongoose");

const DOMAIN_REGEX = /^(?=.{1,253}$)(?!.*\.\.)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
const URL_REGEX = /^https?:\/\/[^\s]+$/i;

const organisationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 32,
      match: /^[A-Z0-9][A-Z0-9_-]{1,31}$/,
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: (value) => !value || URL_REGEX.test(value),
        message: "website must be a valid HTTP(S) URL",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    emailDomain: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 253,
      validate: {
        validator: (value) => !value || DOMAIN_REGEX.test(value),
        message: "emailDomain must be a valid domain name",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deactivatedAt: Date,
  },
  { timestamps: true, strict: "throw" }
);

organisationSchema.pre("validate", function (next) {
  if (!this.isActive && !this.deactivatedAt) return next(new Error("inactive record requires deactivatedAt"));
  if (this.isActive && this.deactivatedAt) return next(new Error("active record cannot have deactivatedAt"));
  next();
});

module.exports = mongoose.model("Organisation", organisationSchema);
