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

// ======================
// || Shared Functions ||
// ======================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'].split(' ');
  const token = authHeader ? authHeader[authHeader.length - 1] : null;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, _user) => {
    if (err) return res.sendStatus(403);
    req.user = _user;
    next();
  });
};

const authUser = async username => {
  const user = await new Promise(resolve => {
    User.authSearch(username, (err, _user) => {
      if (err) throw err;
      return resolve(_user);
    });
  });

  return user ? { success: true, status: 200, msg: user }
  : { success: false, status: 403, msg: 'User not found' };
};

const matchPassword = async (password, hash) => {
  const match = await new Promise(resolve => {
    User.comparePassword(password, hash, (err, _match) => {
      if (err) throw err;
      return resolve(_match);
    });
  });

  return match ? { success: true, status: 200, msg: 'Password and hash match' }
  : { success: false, status: 403, msg: 'Entered and recorded password mismatch' };
};

const passwordCheck = async (username, password) => {
  const user = await authUser(username);
  if (!user.success) return user;
  const match = await matchPassword(password, user.msg.password);
  if (!match.success) return match;
  return { success: true, status: 200, msg: 'User, token, and database data match' };
};

const addminCheck = async (username, password) => {
  const user = await authUser(username);
  if (!user.success) return user;
  const match = await matchPassword(password, user.msg.password);
  if (!match) return match;
  return user.msg.accountType === 'admin' ? { success: true, status: 200, msg: 'User credentials recognized and has admin rights' }
  : { success: false, status: 403, msg: 'User is not an admin' };
};

const duplicateCheck = async (username) => {
  const duplicate = await new Promise(resolve => {
    User.search('username', username, (err, _user) => {
      if (err) throw err;
      return resolve(_user.length ? true : false);
    });
  });

  return duplicate ? { success: false, status: 409, msg: 'Duplicate username' }
  : { success: true, status: 200, msg: 'Unique username' };
};

// =================
// || Create User ||
// =================

router.post('/create', authenticateToken, async (req, res, next) => {
  const admin = req.body.admin;
  const newUser = req.body.newUser;
  const tokenUser = req.user;
  if (admin.username !== tokenUser.username) return res.json({ success: false, status: 401, msg: 'Account does not match token' });
  const adminCheck = await addminCheck(admin.username, admin.password);
  if (!adminCheck.success) return res.json(adminCheck);
  const duplicate = await duplicateCheck(newUser.username);
  if (!duplicate.success) return res.json(duplicate);

  const payload = new userModel({
    username: newUser.username,
    password: newUser.password,
    name: newUser.name,
    accountType: newUser.accountType
  });

  if (newUser.accountType === 'doctor') payload.videoCall = '';

  User.createUser(payload, (err, _user) => {
    if (err) throw err;

    return _user ? res.json({ success: true, status: 200, msg: 'New user created'})
    : res.json({ success: false, status: 500, msg: 'Unable to create new user'});
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
    : res.json({ success: false, status: 403, msg: 'Unable to update user' });
  });
});

router.put('/edit-account', authenticateToken, async (req, res, next) => {
  if (req.body.username !== req.user.username) return res.json({ success: false, status: 401, msg: 'User and token do not match' });
  const match = await passwordCheck(req.body.username, req.body.password);
  if (!match.success) return res.json(match);
  const payload = {};
  if (req.body.newPassword) payload.password = req.body.newPassword;
  if (req.body.newName) payload.name = req.body.newName;
  if (req.body.newUsername) {
    const duplicate = await duplicateCheck(req.body.newUsername);
    if (!duplicate.success) return res.json(duplicate);
    payload.username = req.body.newUsername;
  };
  
  User.updateAccount(req.body.username, payload, (err, _user) => {
    if (err) throw err;
    const token = jwt.sign(_user.toJSON(), process.env.ACCESS_TOKEN_SECRET, { expiresIn: '8h' });
    const resUser = {
      _id: _user._id,
      accountType: _user.accountType,
      name: _user.name,
      username: _user.username
    };

    if (resUser.accountType === 'doctor') resUser.videoCall = _user.videoCall;
    return res.json(_user ? { success: true, status: 200, msg: _user, token: token }
    : { success: false, status: 500, msg: 'Unable to update at this time' });
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
