import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Authorization Header:", authHeader);

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: "Not Authorized, Login Again" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token:", token);

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Authentication failed" });
  }
};

export default authMiddleware;
