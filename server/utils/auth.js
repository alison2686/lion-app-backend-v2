//require library for jwt
const jwt = require("jsonwebtoken");

//generate a token
const generateToken = (userInfo) => {
  if (!userInfo) {
    return null;
  }
  return jwt.sign(userInfo, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

//verifies if token is correct
const verifyToken = (email, token) => {
  return jwt.verify(token, process.env.JWT_SECRET, (error, res) => {
    if (error) {
      return {
        verified: false,
        message: "Invalid Token",
      };
    }
    if (res.email !== email) {
      return {
        verified: false,
        message: "Invalid user credentials.",
      };
    }
    return {
      verified: true,
      message: "User credentials have been verified.",
    };
  });
};

module.exports.generateToken = generateToken;
module.exports.verifyToken = verifyToken;
