const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    scopeType: {
      type: String,
      enum: ["institution", "organisation"],
      required: true,
      immutable: true,
    },
    scopeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 64,
      match: /^[a-z][a-z0-9_]*$/,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    permissions: {
      type: [
        {
          type: String,
          trim: true,
          minlength: 1,
          maxlength: 100,
        },
      ],
      default: [],
      validate: {
        validator: (permissions) => new Set(permissions).size === permissions.length,
        message: "permissions must not contain duplicates",
      },
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deactivatedAt: Date,
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return !this.isSystemRole;
      },
    },
  },
  { timestamps: true, strict: "throw" }
);

roleSchema.index({ scopeType: 1, scopeId: 1, code: 1 }, { unique: true });
roleSchema.index({ scopeType: 1, scopeId: 1, isActive: 1 });

roleSchema.pre("validate", function (next) {
  if (!this.isActive && !this.deactivatedAt) return next(new Error("inactive record requires deactivatedAt"));
  if (this.isActive && this.deactivatedAt) return next(new Error("active record cannot have deactivatedAt"));
  next();
});

module.exports = mongoose.model("Role", roleSchema);
