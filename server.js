// taken from https://github.com/passport/express-4.x-twitter-example/blob/master/server.js#L87
var express = require('express');
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var serveStatic = require('serve-static')


passport.use(new Strategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: 'http://turn-off-retweets.glitch.me/login/twitter/return'
  },
  function(token, tokenSecret, profile, cb) {
    // In this example, the user's Twitter profile is supplied as the user
    // record.  In a production-quality application, the Twitter profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    profile.token = token;
    profile.tokenSecret = tokenSecret;
    return cb(null, profile);
  }));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Create a new Express application.
var app = express();

// Configure view engine to render nunjucks templates.
var nunjucks = require('nunjucks');
nunjucks.configure('views', {
  autoescape: true,
  express: app
});

app.use(serveStatic('static'))

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.get('/login',
  function(req, res){
      res.redirect('/');
  });

app.get('/logout',
    function(req, res){
        req.logout();
        res.redirect('/');
    });

app.get('/login/twitter',
  passport.authenticate('twitter'));

app.get('/login/twitter/return',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

ensure_logged_in = require('connect-ensure-login').ensureLoggedIn;

// Define routes.
app.get('/',
  function(req, res) {
    res.render('index.html', {
      title: 'Welcome',
      user: req.user
    });
  });

app.get('/profile',
  ensure_logged_in(),
  function(req, res) {
    res.render('profile.html', {
      title: 'Profile',
      user: req.user
    });
  });

app.get('/no_retweets.json',
  ensure_logged_in(),
  function(req, res) {
    var url = "friendships/no_retweets/ids.json?stringify_ids=true";
    oauthGet(oauth, url, req.user.token, req.user.tokenSecret, function(data) {
        res.send(data);
      }
    )
  });


app.get('/update_friendship',
  ensure_logged_in(),
  function(req, res) {
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
    var url = "friendships/update.json" + queryString;
    var body = {};
    oauthPost(oauth, url, body, req.user.token, req.user.tokenSecret,
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
  ensure_logged_in(),
  function(req, res) {
    var url = "friends/ids.json";
    oauthGet(oauth, url, req.user.token, req.user.tokenSecret,
      function(data) {
        var ids = JSON.parse(data)["ids"];
        var batches = getIdBatches(ids);
        var responses = [];
        var completed_requests = 0;
        var all_users = []
        for (var i = 0; i < batches.length; i++) {
          var batch_ids = batches[i].join(',');
          var url = "users/lookup.json?user_id=" + batch_ids;
          oauthGet(oauth, url, req.user.token, req.user.tokenSecret,
          function(data) {
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

// default routes
app.use(function(req, res, next) {
  // This handler appears after all the other routes,
  // so it will run any time the route is not found
  res
    .status(404)
    .render('error.html', {
      err: "Can't find " + req.originalUrl,
      title: 'Not found!'
    });
});
app.use(function(err, req, res, next) {
  // This handler takes 4 parameters; `err` will contain
  // the exception thrown by previous handlers
  res
    .status(500)
    .render('error.html', {
      err: err,
      title: "Internal Server Error!"
    });
});

var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

//////////////////////////////////////////////////////////////
//  oauth stuff //////////////////
//////////////////////////
//
var OAuth = require('oauth');

var oauth = new OAuth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  process.env.TWITTER_CONSUMER_KEY,
  process.env.TWITTER_CONSUMER_SECRET,
  '1.0A',
  process.env.PROJECT_URL + '/login/twitter/return',
  'HMAC-SHA1'
);

function oauthPost(oauth, url, postBody, token, tokenSecret, callback) {
  oauth.post(
    "https://api.twitter.com/1.1/" + url,
    token,
    tokenSecret,
    postBody,
    function(error, data, res) {
      if (error) {
      } else {
        callback(data);
      }
    }
  )
}

function oauthGet(oauth, url, token, tokenSecret, callback) {
  oauth.get(
    "https://api.twitter.com/1.1/" + url,
    token,
    tokenSecret,
    function(error, data, res) {
      if (error) {
      } else {
        callback(data);
      }
    }
  )
}

