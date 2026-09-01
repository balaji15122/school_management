const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required',
      });
    }

    // Flatten in case array is passed
    const flatRoles = allowedRoles.flat();

    if (!flatRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Requires one of roles: [${flatRoles.join(', ')}]. Your role: '${req.user.role}'`,
      });
    }

    next();
  };
};

module.exports = authorize;
