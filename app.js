'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const expressValidator = require('express-validator');
const helmet = require('helmet');
const logger = require('morgan');
const mongoose = require('mongoose');
const config = require('config');
const authenticator = require('./middlewares/authenticator');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');
const cors = require('cors');
const path = require('path');
const _ = require('lodash');
global.basePath = path.resolve(__dirname);

const app = express();
app.set('view engine', 'ejs');
mongoose.connect(`mongodb://${config.get('database.host')}:${config.get('database.port')}/${config.get('database.name')}`);

app.use('/media', express.static(path.join(__dirname, 'media')));
app.use(logger('dev'));
app.use(helmet());
app.use(helmet.noCache());
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false, limit: 5 * 1024 * 1024 }));
app.use(bodyParser.json({ limit: 5 * 1024 * 1024 }));
app.use(expressValidator({
  customValidators: {},
}));
app.use(authenticator.authenticate());
app.use(express.static(__dirname + '/public'));

const Message = require('./models/message');
const User = require('./models/user');
app.get('/', (req, res) => {
  Promise.all([
    User.find().limit(300).select('profileImage'),
    Message.find().limit(30).populate('user').sort({ _id: -1 })
  ])
  .then(values => {
    res.render('index', {
      thumbnails: _.map(values[0], 'profileImage'),
      messages: values[1],
      next: values[1].length ? _.last(values[1])._id : null
    });
  })
  .catch(err => {
    res.render('index');
  });
});

app.use('/users', routes.users);
app.use('/messages', routes.messages);
app.use(errorHandler());


module.exports = app;
