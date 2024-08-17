const jwt = require("jsonwebtoken");

const jwtSecretKey = "ibenemeSignalApp";

const genAdminAuthToken = (admin) => {
  const secretKey = jwtSecretKey;

  const token = jwt.sign(
    {
      _id: admin._id,
      email: admin.email,
    },
    secretKey,
    { expiresIn: "1h" } // Token expires in 1 hour
  );

  console.log(token, "token");
  return token;
};

module.exports = genAdminAuthToken;
