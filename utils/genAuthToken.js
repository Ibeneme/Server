
const jwtSecretKey = 'ibenemeSignalApp';
const jwt = require("jsonwebtoken");

const genAuthToken = (user) => {
  const secretKey = jwtSecretKey;

  const token = jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      //  provider: user.provider,
    },
    secretKey
  );
  console.log(token, "token");
  return token;
};

module.exports = genAuthToken;
