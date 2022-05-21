const bcrypt = require("bcryptjs");

const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  let message = req.flash("Error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("Error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("Error", "Invalid email or password.");
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
              res.redirect("/");
            });
          }
          req.flash("Error", "Invalid email or password.");
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
        req.flash("Error", "E-Mail exists already. Please choose another one.");
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
          console.log("User created!");
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

exports.getReset = (req, res, next) => {
  let message = req.flash("Error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};
