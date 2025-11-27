
exports.ensureAuth = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  return res.redirect('/login');
};

exports.ensureGuest = (req, res, next) => {
  if (req.session && req.session.userId) return res.redirect('/');
  return next();
};

exports.ensureAdmin = (req, res, next) => {
  if (req.session && req.session.userRoleId != "1") return res.redirect('/');
  return next();
};
