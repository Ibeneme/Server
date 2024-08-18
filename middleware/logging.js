const Logs = require("../models/Admin/Logs");

const logUpdate = async (req, res, next) => {
  const email = req.user.email; // Assuming you have user details in req.user
  const updateType = req.route.path;

  try {
    await Logs.create({ email, updateType });
    next();
  } catch (err) {
    console.error(err.message);
    next();
  }
};

module.exports = logUpdate;
