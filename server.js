require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyparser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 8080;

// =====================
// || Twilio Messages ||
// =====================

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require('twilio')(accountSid, authToken);

// ===================
// || DB Connection ||
// ===================

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

mongoose.connection.on('connected', () => {
  console.log(`Connected to Database: ${process.env.DATABASE}`);
});

mongoose.connection.on('error', err => {
  console.log(`Database Error: ${err}`);
});

// ===============
// || Socket.io ||
// ===============

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: ['http://localhost:4200', 'https://medical-consultation-dispatch.herokuapp.com']
  }
});

const userList = {};
const userToSocket = {};

io.on('connection', socket => {
  console.log(`=================||    Connected: ${socket.id}     ||=================`);
  socket.on('disconnect', () => {
    console.log(`=================|| User Disconnected ${socket.id} ||=================`);
    delete userList[socket.id];
    
    for (let i = 0; i < Object.keys(userToSocket).length; i++) {
      if (Object.values(userToSocket)[i] === socket.id) {
        delete userToSocket[Object.keys(userToSocket)[i]];
        break;
      };
    };
    
    console.log(userList);
    console.log(userToSocket);
    io.emit('user-list-update', userList);
  });
  
  socket.on('logout', user => {
    console.log(`=================|| User Logged out ${socket.id} ||=================`);
    if (typeof(user) === 'string') user = JSON.parse(user);
    delete userList[socket.id];
    delete userToSocket[user._id];
    console.log(userToSocket)
    console.log(userList); // delete line
    io.emit('user-list-update', userList);
  });

  socket.on('login', user => {
    console.log('=================||             New User Login             ||=================');
    console.log(user)
    // console.log(userToSocket)
    // console.log(`userToSocket[user._id] || ${!!userToSocket[user._id]}`)

    if (userToSocket[user._id]) {
      delete userList[userToSocket[user._id]];
      io.to(userToSocket[user._id]).emit('force-logout');
      io.emit('user-list-update', userList);
    };

    userList[socket.id] = {
      _id: user._id,
      name: user.name,
      accountType: user.accountType
    };

    userToSocket[user._id] = socket.id;
    if (user.accountType === 'doctor') userList[socket.id].videoCall = user.videoCall;
    if (user.accountType !== 'doctor') io.emit('user-list-update', userList);
    io.emit('socket-conversion', userToSocket);
    console.log(userToSocket)
    console.log(userList); // delete line
  });

  socket.on('emit-status', status => { // send full list vs send specified user
    console.log(`=================||        Status Update: ${status}        ||=================`);
    userList[socket.id].status = status;
    console.log(userList[socket.id])
    io.emit('status-change', userList);
  });

  socket.on('emit-link', link => {
    console.log(`========================||        Link Update        ||========================`);
    userList[socket.id].videoCall = link;
    console.log(userList[socket.id]);
    io.emit('link-change', userList);
  });
  
  socket.on('update-account', payload => {
    console.log(`=======================||        Account Update        ||=======================`);
    userList[socket.id].name = payload.name;
    userList[socket.id].accountType = payload.accountType;
    io.emit('user-list-update', userList);
  })

  socket.on('request-user-list', () => {
    console.log(`=====================||        User List Request        ||=====================`);
    console.log(userList);
    io.emit('user-list-update', userList);
  });
  
  socket.on('send-message', payload => {
    console.log(`=========================||        Start Chat        ||========================`);
    const receiver = userToSocket[payload.targetId] ? userToSocket[payload.targetId] : null;
    console.log(payload);
    receiver ? io.to(receiver).emit('update-chat', payload)
    : io.to(socket.id).emit('failed-to-deliver-message', payload);
  });
  
  socket.on('send-text', payload => {
    console.log(`=========================||        Send Text        ||========================`);
    const text = payload.message;
    const recipient = payload.sendTo;
    const regex = /^\d{10}$/;
    const check = regex.test(recipient) && recipient.length === 10;

    if (!text || !recipient || !check) {
      const resPayload = {
        success: false,
        msg: 'Unable to send text message'
      };

      io.to(socket.id).emit('failed-to-send-text', resPayload);
      return;
    };

    twilioClient.messages.create({
      to: `+1${recipient}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: text
    }); // .then(message => console.log(message.sid));

    const resPayload = {
      success: true,
      msg: 'Text was successfully sent'
    };

    io.to(socket.id).emit('sent-text', resPayload);
  });

  socket.on('delete-user', id => {
    console.log(`========================||        Delete User        ||=======================`);
    if (!userToSocket[id]) return;
    io.to(userToSocket[id]).emit('force-logout');
    delete userList[userToSocket[id]];
    delete userToSocket[id];
    io.emit('user-list-update', userList);
  });
});

// ================
// || Middleware ||
// ================

app.use(cors());
app.use(express.static(path.join(__dirname, 'src'))); // dev
// app.use(express.static(path.join(__dirname, '/dist/dispatch-app'))); // production
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
  extended: false
}));

// =======================
// || DB Request Routes ||
// =======================

const users = require('./routes/users');

app.use('/users', users);

app.get('/*', (req, res, next) => {
  res.sendFile(path.join(__dirname, '/dist/dispatch-app', 'index.html'));
});

server.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
