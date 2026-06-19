
exports.ensureAuth = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  return res.redirect('/login');
};

exports.ensureGuest = (req, res, next) => {
  if (req.session && req.session.userId) return res.redirect('/');
  return next();
};

exports.ensureUser = (req, res, next) => {
  if (req.session && req.session.userRoleId == "1") return res.redirect('/admin-dashboard');
  return next();
};

exports.ensureAdmin = (req, res, next) => {
  if (req.session && req.session.userRoleId != "1") return res.redirect('/');
  return next();
};

exports.ensureApiAuth = (req, res, next) => {
  if (req.session && req.session.userId) return next();

  return res.status(401).json({
    success: false,
    message: 'Silakan login terlebih dahulu.',
  });
};

exports.ensureApiAdmin = (req, res, next) => {
  if (req.session && req.session.userRoleId == "1") return next();

  return res.status(403).json({
    success: false,
    message: 'Akses admin diperlukan.',
  });
};
