require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const mongoose = require('mongoose');

module.exports = router;

// ===================
// || Model Imports ||
// ===================

const { userModel } = require('../models/user');
const User = require('../models/user');

// ========================
// || Authenticate Token ||
// ========================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.split(' ')[1] : null;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, _user) => {
    if (err) return res.sendStatus(403);
    req.user = _user;
    next();
  });
};

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
  if (payload.accountType === 'doctor') payload.videoCall = req.body.videoCall;

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
    if (!_user) return res.json({ success: false, msg: 'User not found' });

    User.comparePassword(password, _user.password, (err, _match) => {
      if (err) throw err;
      
      if (_match) {
        const token = jwt.sign(_user.toJSON(), process.env.ACCESS_TOKEN_SECRET, { expiresIn: '12h' });
        const resUser = {
          _id: _user._id,
          username: _user.username,
          name: _user.name,
          accountType: _user.accountType
        };
        if (resUser.accountType === 'doctor') resUser.videoCall = _user.videoCall;

        return res.json({ success: true, token: `JWT ${token}`, user: resUser });
      } else return res.json({ success: false, msg: 'Username and Password do not match'});
    });
  });
});

router.get('/verify-token', authenticateToken, (req, res, next) => {
  return res.json({ status: 200 });
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
