function crudFactory(Model, options = {}) {
  const userField = options.userField || null;

  async function create(req, res) {
    try {
      const doc = await Model.create(req.body);
      return res.status(201).json(doc);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async function getAll(req, res) {
    try {
      const docs = await Model.find({});
      return res.status(200).json(docs);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async function getByUser(req, res) {
    if (!userField) {
      return res.status(400).json({ message: "This resource has no user-scoped listing" });
    }
    try {
      const docs = await Model.find({ [userField]: req.params.userId });
      return res.status(200).json(docs);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async function getById(req, res) {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) {
        return res.status(404).json({ message: "Not found" });
      }
      return res.status(200).json(doc);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async function update(req, res) {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) {
        return res.status(404).json({ message: "Not found" });
      }
      return res.status(200).json(doc);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async function remove(req, res) {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) {
        return res.status(404).json({ message: "Not found" });
      }
      return res.status(200).json({ message: "Deleted" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  return { create, getAll, getByUser, getById, update, remove };
}

module.exports = crudFactory;
