module.exports = function (db) {
  
  var passport = require('passport');
  var twitter = require('./twitter')(passport, db);
  require('./sessions')(passport, db);
  return {
    twitter: twitter,
    sql_session: require('./sql_session'),
    init: function(app) {
      
      // Initialize Passport and restore authentication state, if any, from the
      // session.
      app.use(passport.initialize());
      app.use(passport.session());

      // setup the routes necessary for each provider
      twitter.routes(app);
      
      // list the json of each user in the system (including passwords for local users)
      app.get('/auth/db/users', function(req, res) {
        var users = db.sqlite.fetch();
        res.render('auth/users.html', {
          title: 'Users',
          users: users.map(function(user) {
            return JSON.stringify(user);
          })});
      });
      
      app.get('/logout',
        function(req, res){
          req.logout();
          res.redirect('/');
        });

    }
  };
};