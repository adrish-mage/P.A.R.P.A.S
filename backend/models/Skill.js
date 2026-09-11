const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    category: { type: String, enum: ["technical", "soft"], required: true },
    description: { type: String, trim: true, maxlength: 1000 },
    parentSkillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", default: null },
    aliases: {
      type: [{ type: String, trim: true, minlength: 1, maxlength: 120 }],
      default: [],
      validate: {
        validator: (aliases) => {
          const normalized = aliases.map((a) => a.toLowerCase());
          return new Set(normalized).size === normalized.length;
        },
        message: "a skill cannot contain duplicate aliases (case-insensitive)",
      },
    },
    isActive: { type: Boolean, default: true },
    deactivatedAt: Date,
  },
  { timestamps: true, strict: "throw" }
);

skillSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
skillSchema.index({ aliases: 1 }, { collation: { locale: "en", strength: 2 } });
skillSchema.index({ category: 1, isActive: 1 });

skillSchema.pre("validate", async function (next) {
  if (this.parentSkillId && String(this.parentSkillId) === String(this._id)) {
    return next(new Error("a skill cannot be its own parent"));
  }

  if (!this.isActive && !this.deactivatedAt) {
    return next(new Error("inactive skill requires deactivatedAt"));
  }
  if (this.isActive && this.deactivatedAt) {
    return next(new Error("active skill cannot have deactivatedAt"));
  }

  const normalizedName = this.name.toLowerCase();
  if (this.aliases.some((alias) => alias.toLowerCase() === normalizedName)) {
    return next(new Error("a skill alias cannot be identical to its own skill name"));
  }

  if (!this.parentSkillId) return next();

  const parent = await this.constructor.findById(this.parentSkillId).select("_id category parentSkillId").lean();
  if (!parent) return next(new Error("parentSkillId must reference an existing skill"));
  if (parent.category !== this.category) {
    return next(new Error("parent skill must have the same category"));
  }

  const visited = new Set([String(this._id)]);
  let currentId = parent._id;
  while (currentId) {
    const key = String(currentId);
    if (visited.has(key)) {
      return next(new Error("skill hierarchy cannot contain cycles"));
    }
    visited.add(key);
    const ancestor = await this.constructor.findById(currentId).select("parentSkillId").lean();
    currentId = ancestor?.parentSkillId || null;
  }

  next();
});

skillSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
  const update = this.getUpdate() || {};
  const parentId = update.parentSkillId ?? update.$set?.parentSkillId;
  if (parentId === undefined) return next();
  const current = await this.model.findOne(this.getQuery()).select("_id category").lean();
  if (!current) return next();
  if (parentId && String(parentId) === String(current._id)) return next(new Error("a skill cannot be its own parent"));
  if (!parentId) return next();
  const parent = await this.model.findById(parentId).select("_id category parentSkillId").lean();
  if (!parent) return next(new Error("parentSkillId must reference an existing skill"));
  if (parent.category !== current.category) return next(new Error("parent skill must have the same category"));
  const visited = new Set([String(current._id)]);
  let ancestorId = parent._id;
  while (ancestorId) {
    const key = String(ancestorId);
    if (visited.has(key)) return next(new Error("skill hierarchy cannot contain cycles"));
    visited.add(key);
    const ancestor = await this.model.findById(ancestorId).select("parentSkillId").lean();
    ancestorId = ancestor?.parentSkillId || null;
  }
  next();
});

module.exports = mongoose.model("Skill", skillSchema);
