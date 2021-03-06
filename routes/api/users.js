const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');
const sendEmail = require('../../helpers/sendmail');

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');
const validateForgotPasswordInput = require('../../validation/forgotpassword');
// Load User model
const User = require('../../models/User');

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Users Works' }));

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = 'Email already exists';
      return res.status(400).json(errors);
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: '200', // Size
        r: 'pg', // Rating
        d: 'mm' // Default
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});
const randomString = length => {
  let text = "";
  const possible = "abcdefghijklmnopqrstuvwxyz0123456789_-.";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
// @route   POST api/users/forgotpassword
// @desc    Forgot Password
// @access  Public
router.put('/forgotpassword', (req, res) => {
  if (!req.body) return res.status(400).json({ message: "No Request body" });
  if (!req.body.email) return res.status(400).json({ message: "No Email in the Request body" });
  const token = randomString(40);
  const { errors, isValid } = validateForgotPasswordInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  var APP_URL_BASE=process.env;
  User.updateOne({ email: req.body.email }, { $set: { resetPassLink: token } }).then(user => {
    if (user) {
      errors.email = 'Reset Link set to registered Email ID';
      const emailData = {
        to: req.body.email,
        subject: "Reset Password",
        text: "Please use the following link for instruction to reset your password: ${APP_URL_BASE}/resetpass/${token}",
        html: "<p>Please use the following link for instruction to reset your password: ${APP_URL_BASE}/resetpass/${token}</p>",
      }
      sendEmail(emailData);
      return res.status(400).json(errors);
    } else {
      errors.email = 'Email not Registered';
      return res.status(400).json(errors);
    }
  });
});

// @route   POST api/users/resetpass
// @desc    Reset Password
// @access  Public
router.put('/resetpass', (req, res) => {
  const { resetPassLink, newPassword } = req.body;
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newPassword, salt, (err, hash) => {
      if (err) throw err;
      User.password = hash;
      User.update({resetPassLink},{$set:{password:hash,resetPassLink:''}})
      .then(user => res.json(User))
      .catch(err => console.log(err));
    });
  });
});


// @route   GET api/users/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({ email }).then(user => {
    // Check for user
    if (!user) {
      errors.email = 'User not found';
      return res.status(404).json(errors);
    }

    // Check Password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User Matched
        const payload = { id: user.id, name: user.name, avatar: user.avatar }; // Create JWT Payload

        // Sign Token
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: 'Bearer ' + token
            });
          }
        );
      } else {
        errors.password = 'Password incorrect';
        return res.status(400).json(errors);
      }
    });
  });
});

// @route   GET api/users/current
// @desc    Return current user
// @access  Private
router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
  }
);

module.exports = router;
