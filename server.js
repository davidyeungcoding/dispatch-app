require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyparser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 8080;

// ===================
// || DB Connection ||
// ===================

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
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

io.on('connection', socket => {
  console.log(`=================||    Connected: ${socket.id}     ||=================`);
  socket.on('disconnect', user => {
    console.log(`=================|| User Disconnected ${socket.id} ||=================`);
    delete userList[socket.id];
    console.log(userList); // delete line
    io.emit('user-list-update', userList);
  });
  
  socket.on('logout', user => {
    console.log(`=================|| User Logged out ${socket.id} ||=================`);
    delete userList[socket.id];
    console.log(userList); // delete line
    io.emit('user-list-update', userList);
  });

  socket.on('login', user => {
    console.log('=================||             New User Login             ||=================');
    console.log(user)
    userList[socket.id] = {
      _id: user._id,
      socketId: socket.id,
      name: user.name,
      accountType: user.accountType
    };
    if (user.accountType === 'doctor') userList[socket.id].videoCall = user.videoCall;
    if (user.accountType !== 'doctor') io.emit('user-list-update', userList);
    console.log(userList); // delete line
  });

  socket.on('emit-status', status => { // send full list vs send specified user
    console.log(`=================||        Status Update: ${status}        ||=================`);
    userList[socket.id].status = status;
    console.log(userList[socket.id])
    io.emit('status-change', userList);
  });

  socket.on('emit-link', link => {
    console.log(`=====================||        Link Update        ||=====================`);
    userList[socket.id].videoCall = link;
    console.log(userList[socket.id]);
    io.emit('link-change', userList);
  });
});

// ================
// || Middleware ||
// ================

app.use(cors());
// app.use(express.static(path.join(__dirname, 'src'))); // dev
app.use(express.static(path.join(__dirname, '/dist/dispatch-app'))); // production
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
  extended: false
}));

// =======================
// || DB Request Routes ||
// =======================

const users = require('./routes/users');

app.use('/users', users);

server.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
