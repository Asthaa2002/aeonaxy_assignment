const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization; 
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], 'astha_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: 'Forbidden: Invalid token' });
  }
};

module.exports = verifyToken;
