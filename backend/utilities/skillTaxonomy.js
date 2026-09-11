const Skill = require("../models/Skill");

async function resolveSkillNames(names = []) {
  const resolved = [];
  const unresolved = [];

  for (const raw of names) {
    const name = String(raw).trim();
    const match = await Skill.findOne({
      $or: [
        { name: new RegExp(`^${name}$`, "i") },
        { aliases: new RegExp(`^${name}$`, "i") },
      ],
    });
    if (match) {
      resolved.push(match._id);
    } else {
      unresolved.push(name);
    }
  }

  return { resolved, unresolved };
}

module.exports = { resolveSkillNames };
