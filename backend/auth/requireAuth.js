// requireAuth: rejects a request with 401 unless it carries a valid JWT.
// On success it attaches the decoded token (name, role, orgId) to req.user.
const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const header = req.header('Authorization');
  const token = header && header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};