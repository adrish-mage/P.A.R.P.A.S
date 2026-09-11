function roleGuard(...allowedAccountTypes) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!allowedAccountTypes.includes(req.user.accountType)) {
      return res.status(403).json({ message: "Not permitted for this account type" });
    }
    return next();
  };
}

module.exports = roleGuard;
