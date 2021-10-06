require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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

const buildPayloadForToken = user => {
  const payload = {
    _id: user._id,
    username: user.username,
    name: user.name,
    accountType: user.accountType
  };

  if (payload.accountType === 'doctor') payload.videoCall = user.videoCall;
  return payload;
};

const generateAuthToken = user => {
  const parsedUser = buildPayloadForToken(user);
  return jwt.sign(parsedUser, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = user => {
  const parsedUser = buildPayloadForToken(user);
  return jwt.sign(parsedUser, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '3d' });
};

const getRefreshToken = async username => {
  const token = await new Promise(resolve => {
    User.refreshTokenSearch(username, (err, _token) => {
      if (err) throw err;
      return resolve(_token[0].refreshToken);
    });
  });
  return token;
};

const authenticateRefreshToken = token => {
  const validToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, _user) => {
    return err ? false : true;
  });
  return validToken;
};

const handleRefreshAuthToken = async token => {
  const refreshToken = await getRefreshToken(token.username);
  if (!refreshToken) return false;
  const validRefreshToken = authenticateRefreshToken(refreshToken);
  if (!validRefreshToken) return false;
  return generateAuthToken(token);
};

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'].split(' ');
    const token = authHeader ? authHeader[authHeader.length - 1] : null;
    if (!token) return res.json({ success: false, status: 400, msg: 'Missing authorization credentials' });
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, _user) => {
      if (err && err.name !== 'TokenExpiredError') {
        return res.json({ success: false, status: 403, msg: 'User is not authorized for access' });
      } else if (err && err.name === 'TokenExpiredError') {
        const tokenUser = jwt.decode(token);
        const resToken = await handleRefreshAuthToken(tokenUser);
        if (!resToken) return res.json({ success: false, status: 403, msg: 'User is not authorized for access' });
        req.token = `JWT ${resToken}`;
        _user = tokenUser;
      };
      
      req.user = _user;
      next();
    });
  } catch { return res.json({ success: false, status: 400, msg: 'Missing authorization credentials' })};
};

const assignRefreshToken = async user => {
  const refreshToken = await generateRefreshToken(user.username);

  const refreshTokenStatus = await new Promise(resolve => {
    User.addRefreshToken(user._id, refreshToken, (err, _user) => {
      if (err) return resolve({ success: false, status: 500, msg: 'Unable to log in at this time' });
      return resolve({ success: true, status: 200, msg: 'Successfully added refresh token' });
    });
  });

  return refreshTokenStatus;
};

const authUser = async username => {
  const user = await new Promise(resolve => {
    User.authSearch(username, (err, _user) => {
      if (err) throw err;
      return resolve(_user);
    });
  });

  return user ? { success: true, status: 200, msg: user }
  : { success: false, status: 401, msg: 'User not found' };
};

const matchPassword = async (password, hash) => {
  const match = await new Promise(resolve => {
    User.comparePassword(password, hash, (err, _match) => {
      if (err) throw err;
      return resolve(_match);
    });
  });

  return match ? { success: true, status: 200, msg: 'Password and hash match' }
  : { success: false, status: 401, msg: 'Username and password mismatch' };
};

const adminCheck = async (username, password) => {
  const user = await authUser(username);
  if (!user.success) return user;
  const match = await matchPassword(password, user.msg.password);
  if (!match.success) return match;
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
  try {
    const admin = req.body.admin;
    const newUser = req.body.newUser;
    const tokenUser = req.user;
    if (!admin || !newUser || !tokenUser) return res.json({ success: false, status: 400, msg: 'Missing payload' })
    if (admin.username !== tokenUser.username) return res.json({ success: false, status: 401, msg: 'Account does not match token' });
    const checkAdmin = await adminCheck(admin.username, admin.password);
    if (!checkAdmin.success) return res.json(checkAdmin);
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
      const response = _user ? { success: true, status: 200, msg: 'New user created' }
      : { success: false, status: 500, msg: 'Unable to create new user' };
      if (req.token) response.token = req.token;
      return res.json(response);
    });
  } catch { return res.json({ success: false, status: 400, msg: 'Unable to create new user at this time' })};
});

// =======================
// || Authenticate User ||
// =======================

router.post('/authenticate', async (req, res, next) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) return res.json({ success: false, status: 400, msg: 'Please fill out all fields' })
    const user = await authUser(username);
    if (!user.success) return res.json(user);
    const match = await matchPassword(password, user.msg.password);
    if (!match.success) return res.json(match);
    const token = generateAuthToken(user.msg.toJSON());
    
    const resUser = {
      _id: user.msg._id,
      username: user.msg.username,
      name: user.msg.name,
      accountType: user.msg.accountType
    };
    
    if (resUser.accountType === 'doctor') resUser.videoCall = user.msg.videoCall;
    const refreshTokenStatus = await assignRefreshToken(resUser);
    if (!refreshTokenStatus.success) res.json(refreshTokenStatus);

    return res.json({ success: true, status: 200, token: `JWT ${token}`, user: resUser });
  } catch { return res.json({ success: false, status: 400, msg: 'Unable to process request at this time' })};
});

router.get('/verify-token', authenticateToken, async (req, res, next) => {
  const response = { status: 200 };
  if (req.token) response.token = req.token;
  return res.json(response);
});

router.post('/verify-admin', authenticateToken, (req, res, next) => {
  try {
    const id = req.body._id;
    if (!id || id.length !== 24) return res.json({ success: false, status: 400, msg: 'Invalid request' });
    if (req.user._id !== id) return res.json({ success: false, status: 403, msg: 'User does not match request' });
    if (req.user.accountType !== 'admin') return res.json({ success: false, status: 401, msg: 'User not an admin' });
    const response = { status: 200 };
    if (req.token) response.token = req.token;
    if (req.user._id === id && req.user.accountType === 'admin') return res.json(response);
    return res.json({ status: 400 });
  } catch { return res.json({ success: false, status: 400, msg: 'Unable to verify user' })};
});

router.get('/logout', (req, res, next) => {
  try {
    const _id = req.query._id;
    if (_id.length !== 24) return res.json({ status: 400 });
  
    User.clearRefreshToken(_id, (err, _user) => {
      if (err) throw err;
      return res.json({ status: 200 });
    });
  } catch { return res.json({ status: 400 })};
});

router.get('/request-new-token', async (req, res, next) => {
  try {
    const user = JSON.parse(req.query.user);
    const newToken = await handleRefreshAuthToken(user);
    return newToken ? res.json({ success: true, status: 200, msg: 'Successfully generated new token', token: newToken })
    : res.json({ success: false, status: 400, msg: 'Unable to generate new token' });
  } catch { return res.json({ success: false, status: 400, msg: 'Unable to generate new token' }) };
});

// ===============
// || Edit User ||
// ===============

router.put('/change-one', authenticateToken, async (req, res, next) => {
  try {
    const id = req.body._id;
    const targetId = req.body.targetId;
    if (id.length !== 24 || targetId.length !== 24) return res.json({ success: false, status: 400, msg: 'Invalid Request' });
    const target = req.body.target;
    const change = req.body.change;
    if (!id || !targetId || !target || !change) return res.json({ success: false, status: 400, msg: 'Missing payload' });
    if (id !== targetId) return res.json({ success: false, status: 403, msg: 'Not your account' });
    const update = { [target]: change };
    
    User.changeOne(targetId, update, (err, _user) => {
      if (err) throw err;
      const token = generateAuthToken(_user.toJSON());
      return _user ? res.json({ success: true, status: 200, msg: 'User successfully updated', token: token })
      : res.json({ success: false, status: 403, msg: 'Unable to update user' });
    });
  } catch { return res.json({ success: false, status: 400, msg: 'Unable to process request at this time' })};
});

router.put('/edit-account', authenticateToken, async (req, res, next) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) return res.json({ success: false, status: 400, msg: 'Missing payload' });
    if (username !== req.user.username) return res.json({ success: false, status: 406, msg: 'User and token do not match' });
    const user = await authUser(username);
    if (!user.success) return res.json(user);
    const match = await matchPassword(password, user.msg.password);
    if (!match.success) return res.json(match);
    const payload = {};
    if (req.body.newPassword) payload.password = req.body.newPassword;
    if (req.body.newName) payload.name = req.body.newName;
    
    if (req.body.newUsername) {
      const duplicate = await duplicateCheck(req.body.newUsername);
      if (!duplicate.success) return res.json(duplicate);
      payload.username = req.body.newUsername;
    };

    if (!Object.keys(payload).length) return res.json({ success: false, status: 400, msg: 'Missing payload' });
    
    User.updateAccount(req.body.username, payload, (err, _user) => {
      if (err) throw err;
      const token = generateAuthToken(_user.toJSON());
      const resUser = {
        _id: _user._id,
        accountType: _user.accountType,
        name: _user.name,
        username: _user.username
      };

      if (resUser.accountType === 'doctor') resUser.videoCall = _user.videoCall;
      return res.json(_user ? { success: true, status: 200, msg: resUser, token: token }
      : { success: false, status: 500, msg: 'Unable to update at this time' });
    });
  } catch { return res.json({ success: false, status: 400, msg: 'Unable to process request at this time' })};
});

router.put('/update-user', authenticateToken, async (req, res, next) => {
  try {
    const admin = req.body.admin;
    const editUser = req.body.user;
    if (!admin || !editUser || editUser._id.length !== 24) return res.json({ success: false, status: 400, msg: 'Invalid request' });
    const newToken = req.token ? req.token : null;
    const tokenUser = req.user;
    if (tokenUser.username !== admin.username) return res.json({ success: false, status: 401, msg: 'Unauthorized access' });
    const checkAdmin = await adminCheck(admin.username, admin.password);
    if (!checkAdmin.success) return res.json(checkAdmin);
    const payload = {};
    if (editUser.name) payload.name = editUser.name;
    
    if (editUser.username) {
      const duplicate = await duplicateCheck(editUser.username);
      if (!duplicate.success) return res.json(duplicate);
      payload.username = editUser.username;
    };

    if (editUser.videoCall) payload.videoCall = editUser.videoCall;
    if (editUser.accountType) payload.accountType = editUser.accountType;
    if (!Object.keys(payload).length) return res.json({ success: false, status: 400, msg: 'No changes detected' });
    

    User.updateUser(editUser._id, payload, (err, _user) => {
      if (err) throw err;

      const resUser = {
        _id: _user._id,
        name: _user.name,
        username: _user.username,
        accountType: _user.accountType
      };

      if (resUser.accountType === 'doctor') resUser.videoCall = _user.videoCall;
      const response = _user ? { success: true, status: 200, msg: 'User successfully updated', user: resUser }
      : { success: false, status: 400, msg: 'Unable to find user to change' };
      if (newToken) response.token = newToken;
      return res.json(response);
    });
  } catch { return res.json({ success: false, status: 400, msg: 'Unable to process request as is' }) };
});

// =================
// || Delete User ||
// =================

router.post('/delete-user', authenticateToken, async (req, res, next) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const targetId = req.body.targetId;
    const tokenUser = req.user;
    if (!username || !password || !targetId || targetId.length !== 24) return res.json({ success: false, status: 400, msg: 'Missing payload' });
    if (username !== tokenUser.username) return res.json({ success: false, status: 401, msg: 'User does not match token' });
    const checkAdmin = await adminCheck(username, password);
    if (!checkAdmin.success) return res.json(checkAdmin);

    User.deleteUser(targetId, (err, _res) => {
      if (err) throw err;
      const response = _res ? { success: true, status: 200, msg: 'User has been purged' }
      : { success: false, status: 404, msg: 'User not found' };
      if (req.token) response.token = req.token;
      return res.json(response);
    });
  } catch { return res.json({ success: false, status: 400, msg: 'Unable to process request at this time' }) };
});

// =================
// || Search User ||
// =================

// not yet in use, will have to come back and update checks for payload
// when it does.
// validation for _id needs to be a 24 char string
router.get('/search', (req, res, next) => {
  const type = req.query.type;
  const term = type === '_id' ? mongoose.Types.ObjectId(req.query.term)
  : new RegExp(req.query.term, 'i');

  User.search(type, term, (err, _users) => {
    if (err) throw err;

    return _users ? res.json({ success: true, msg: _users })
    : res.json({ success: false, msg: 'Unable to search for user' });
  });
});

router.get('/full-user-list', (req, res, next) => {
  User.getAll((err, _list) => {
    if (err) throw err;

    return _list ? res.json({ success: true, status: 200, msg: _list })
    : res.json({ success: false, status: 404, msg: 'Unable to retrieve list' });
  });
});
