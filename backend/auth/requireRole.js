// requireRole('editor'): rejects with 403 unless the logged-in user has that role.
// Must run AFTER requireAuth, which sets req.user from the JWT.
module.exports = function requireRole(role) {
  return function (req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: `Forbidden: ${role} role required` });
    }
    next();
  };
};