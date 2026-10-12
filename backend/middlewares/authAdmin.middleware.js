import jwt from "jsonwebtoken";

export const authAdminMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && (req.cookies.token || req.cookies.adminToken)) {
      token = req.cookies.token || req.cookies.adminToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      msg: "Invalid or expired token"
    });
  }
};
