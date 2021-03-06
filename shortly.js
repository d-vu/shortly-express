var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('client-sessions');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  cookieName: 'session',
  secret: '1234',
  duration: 1000 * 60 * 10, // 10 mins
  activeDuration: 5 * 60 * 1000 //5 mins
}));


var redirect = function(req, res, next){
  if(req.session.validUser){
    next();
  } else {
    res.redirect('/login');
  }
};

var check = function () {
  alert('LOLOLL');
  console.log("We are in shortly.js");
};

app.get('/', redirect,
function(req, res) {
  console.log(req.session);
  res.render('index');
});

app.get('/create', redirect,
function(req, res) {
  res.render('index');
});

app.get('/login', 
function(req, res) {
  req.session.destroy();
  res.render('login');
});

app.post('/login',
function(req, res) {
  var theUserName = req.body.username;
  var pass = req.body.password;

  new User({username: theUserName}).fetch().then(function(found) {
    // valid user name
    if (found) {
      bcrypt.compare(pass, found.attributes.password, function(err, res2) {
        // password matches
        if (res2) {
          req.session.validUser = theUserName;
          res.status(200).redirect('/');
        } else {
        // password does not match
          res.status(404).send('Invalid password');
        }
      });
    } else {
      res.status(404).send('Invalid username');
      //username not found
    }
  });
});

app.get('/signup', 
function(req, res) {
  res.render('signup');
});

app.post('/signup',
  function(req, res) {
    var theUserName = req.body.username;
    var pass = req.body.password;

    new User({ username: theUserName}).fetch().then(function(found) {
      // username or password already exists
      if (found) {
        res.status(403).send('username already exists');
      } else {
      // create new username and password and redirect to homepage
        Users.create({
          username: theUserName,
          password: pass
        })
        .then(function(newUser) {
          req.session.validUser = theUserName;
          res.status(200).redirect('/');
        });

      }
    });
  }
);

app.get('/links', redirect, 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568); 
