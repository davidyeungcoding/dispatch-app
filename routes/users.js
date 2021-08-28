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

router.post('/create', authenticateToken, async (req, res, next) => {
  const creatorId = mongoose.Types.ObjectId(req.body.creatorId);

  const adminCheck = await new Promise(resolve => {
    User.search('_id', creatorId, (err, _user) => {
      if (err) throw err;
      resolve(!_user.length || _user[0].accountType !== 'admin' ? false : true);
    });
  });

  if (!adminCheck) return res.json({ success: false, status: 401, msg: 'Creator is not an admin' });

  const duplicate = await new Promise(resolve => {
    User.search('username', req.body.username, (err, _user) => {
      if (err) throw err;
      console.log(`username: ${req.body.username}, || array length: ${_user.length} || ${!!_user.length}`)
      resolve(!!_user.length ? true : false);
    });
  });

  console.log(`duplicate: ${duplicate}`)
  if (duplicate) return res.json({ success: false, status: 400, msg: 'Duplicate username'});

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
    if (!_user) return res.json({ success: false, msg: 'User not found' });

    User.comparePassword(password, _user.password, (err, _match) => {
      if (err) throw err;
      
      if (_match) {
        const token = jwt.sign(_user.toJSON(), process.env.ACCESS_TOKEN_SECRET, { expiresIn: '8h' });
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

router.post('/verify-admin', authenticateToken, (req, res, next) => {
  console.log(`Res: ${req.user.accountType} || ${req.user.accountType === 'admin'}`);
  console.log(`Res: ${req.user._id} || Sent: ${req.body._id} || ${req.user._id === req.body._id}`);
  if (req.user._id === req.body._id && req.user.accountType === 'admin') return res.json({ status: 200 });
  if (req.user._id !== req.body._id) return res.json({ status: 403 });
  if (req.user.accountType !== 'admin') return res.json({ status: 401 });
  return res.json({ status: 400 });
});

// ===============
// || Edit User ||
// ===============

router.put('/edit', authenticateToken, async (req, res, next) => {
  if (req.body._id !== req.body.targetId) return res.json({ success: false, status: 403, msg: 'Not your account' });
  const update = { [req.body.target]: req.body.change };
  
  User.editUser(req.body.targetId, update, (err, _user) => {
    if (err) throw err;

    return _user ? res.json({ success: true, status: 200, msg: 'User successfully updated' })
    : res.json({ success: false, status: 400, msg: 'Unable to update user' });
  });
});

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
