const bcrypt = require("bcryptjs");

const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        console.log("No user found");
        return res.redirect("/login");
      }
      bcrypt
        .compare(password, user.password)
        .then((match) => {
          if (match) {
            console.log("Password correct!");
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((error) => {
              console.log("error", error);
              res.redirect("/");
            });
          }
          console.log("Wrong password");
          res.redirect("/login");
        })
        .catch((error) => {
          console.log(error);
          res.redirect("/login");
        });
    })
    .catch((error) => console.log(error));
};

exports.postSignup = (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        console.log("User already exists");
        return res.redirect("/signup");
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] },
          });
          return user.save();
        })
        .then((result) => {
          console.log("User created!", result);
          res.redirect("/");
        });
    })
    .catch((error) => console.log(error));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((error) => {
    console.log("error", error);
    res.redirect("/");
  });
};
