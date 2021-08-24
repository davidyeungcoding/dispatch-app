const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const mongoose = require('mongoose');
const config = require('../config/database');

module.exports = router;

// ===================
// || Model Imports ||
// ===================

const { userModel } = require('../models/user');
const User = require('../models/user');

// =================
// || Create User ||
// =================

router.post('/create', (req, res, next) => {
  const payload = new userModel({
    username: req.body.username,
    password: req.body.password,
    name: req.body.name,
    accountType: req.body.accountType
  });

  User.createUser(payload, (err, _user) => {
    if (err) throw err;

    return _user ? res.json({ success: true, msg: 'New user created'})
    : res.json({ success: false, msg: 'Unable to create new user'});
  });
});

// =======================
// || Authenticate User ||
// =======================

router.post('/authenticate', (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

  User.authSearch(username, (err, _user) => {
    if (err) throw err;
    if (!_user) return { success: false, msg: 'User not found' };

    User.comparePassword(password, _user.password, (err, _match) => {
      if (err) throw err;
      
      if (_match) {
        const token = jwt.sign(_user.toJSON(), config.secret, { expiresIn: '43200000' });
        const resUser = {
          _id: _user._id,
          username: _user.username,
          name: _user.name,
          accountType: _user.accountType
        };

        if (resUser.accountType === 'doctor') {
          resUser.status = _user.status;
          resUser.videoCall = _user.videoCall;
        };

        return res.json({ success: true, token: `JWT ${token}`, user: resUser });
      } else return res.json({ success: false, msg: 'Username and Password do not match'});
    });
  });
});

// ===============
// || Edit User ||
// ===============

// =================
// || Search User ||
// =================

router.get('/search', (req, res, next) => {
  const type = req.query.type;
  const term = req.query.type === '_id' ? mongoose.Types.ObjectId(req.query.term)
  : new RegExp(req.query.term, 'i');

  User.search(type, term, (err, _users) => {
    if (err) throw err;

    return _users ? res.json({ success: true, msg: _users })
    : res.json({ success: false, msg: 'Unable to search for user' });
  });
});

router.get('/dispatch', passport.authenticate('jwt', { session: false }), (req, res, next) => {
  res.send('DISPATCH');
});
