function authMiddleware(req, res, next) {
  const userId = req.header("x-user-id");
  const accountType = req.header("x-account-type");

  if (process.env.DEV_AUTH_BYPASS === "true" && !userId && !accountType) {
    req.user = {
      id: process.env.DEV_AUTH_USER_ID || "000000000000000000000000",
      accountType: process.env.DEV_AUTH_ACCOUNT_TYPE || "Student",
      devBypass: true,
    };
    return next();
  }

  if (!userId || !accountType) {
    return res.status(401).json({
      message:
        "Missing auth headers (x-user-id, x-account-type). DUMMY auth until DigiLocker/custom pipeline login is wired in.",
    });
  }

  req.user = { id: userId, accountType };
  return next();
}

module.exports = authMiddleware;
