function localVariables(req, res, next) {
  req.app.locals.OTP = null;
  req.app.locals.resetSession = false;
  next();
}

module.exports = localVariables;
