import User from "../models/Users";

export async function getUser(req, res) {
  const { name } = req.params;
  try {
    if (username) return res.status(501).send({ error: "Invalid Username" });
    User.findOne({ name }, function (err, user) {
      if (err) return res.status(500).send({ err });
      if (!user) return res.status(501).send({ error: `Couldn't find user` });
      const { password, ...rest } = user;
      return res.status(201).send(rest);
    });
  } catch (error) {
    return res.status(404).send({ error: "Cannot find user data" });
  }
}


module.exports = controller;