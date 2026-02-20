const jwt = require('jsonwebtoken');

/**
 * Multi-tenant Middleware
 * Validates the JWT token and extracts the societyId.
 * Guarantees that every request handled by this middleware is bound to a specific society.
 */
const tenantMiddleware = (req, res, next) => {
  try {
    let token;
    
    // Check if token is passed in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Strict enforcement of Multi-Tenancy (societyId must exist)
    if (!decoded.societyId) {
       return res.status(403).json({ message: 'Access denied: No Society ID found in token. Multi-tenancy rule violation.' });
    }
    
    // Attach data to request for modules to use
    req.user = decoded;
    req.societyId = decoded.societyId;
    
    next();
  } catch (error) {
    console.error('Tenant Middleware Error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token validation failed' });
  }
};

module.exports = tenantMiddleware;
