const Skill = require("../models/Skill");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function search(req, res) {
  try {
    const q = req.query.query;
    const filter = q
      ? { $or: [{ name: new RegExp(escapeRegex(q), "i") }, { aliases: new RegExp(escapeRegex(q), "i") }] }
      : { isActive: true };
    const skills = await Skill.find(filter).limit(50);
    return res.status(200).json(skills);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function create(req, res) {
  try {
    const skill = await Skill.create(req.body);
    return res.status(201).json(skill);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { search, create };
