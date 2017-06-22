var express = require('express');
var db = require('./db');
var auth = require('./auth')(db);
var serveStatic = require('serve-static')


// Create a new Express application.
var app = express();

// Configure view engine to render nunjucks templates.
var nunjucks = require('nunjucks');
nunjucks.configure('views', {
  autoescape: true,
  express: app
});

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(serveStatic('static'))
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({
  extended: true
}));
app.use(auth.sql_session.sql_session);
//app.use(require('express-session')({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));

auth.init(app);

// Define routes.
app.get('/',
  function(req, res) {
    res.render('index.html', {
      title: 'Welcome',
      user: req.user
    });
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res) {
    // auth.twitter.get(
    //   "followers/ids.json",
    //   function(data) {

    //   }
    // );
    res.render('profile.html', {
      title: 'Profile',
      user: req.user
    });
  });

app.get('/no_retweets.json',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res) {
    var twitter = auth.twitter;
    twitter.get(
      "friendships/no_retweets/ids.json?stringify_ids=true",
      function(data) {
        res.send(data);
      }
    )
  });


app.get('/update_friendship',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res) {
    var twitter = auth.twitter;
    var postData = {
      'screen_name': req.query.screen_name
    };
    var queryString = "?screen_name=" + req.query.screen_name
    if (req.query.retweets == 'true') {
      queryString += "&retweets=true"
    }
    if (req.query.retweets == 'false') {
      queryString += "&retweets=false"
    }
    console.log(postData);
    //req.query['retweets']
    twitter.post(
      "friendships/update.json" + queryString, {},
      function(data) {
        res.send(data);
      }
    )
  });

function getIdBatches(ids) {
  if (ids.length == 0) {
    return []
  } else {
    var arr = getIdBatches(ids.slice(100))
    arr.push(ids.slice(0, 100));
    return arr
  }
}

app.get('/users.json',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res) {
    var twitter = auth.twitter;
    twitter.get(

      "friends/ids.json",
      function(data) {
        var ids = JSON.parse(data)["ids"];
        var batches = getIdBatches(ids);
        var responses = [];
        var completed_requests = 0;
        var all_users = []
        console.log(batches);
        for (var i = 0; i < batches.length; i++) {
          var batch_ids = batches[i].join(',');
          twitter.get("users/lookup.json?user_id=" + batch_ids, function(data) {
            responses = responses.concat(JSON.parse(data));
            completed_requests++;
            if (completed_requests == batches.length) {
              res.send(JSON.stringify(responses));
            }

          });

        }

      }
    )
  });

require('./default-handlers')(app);

var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});