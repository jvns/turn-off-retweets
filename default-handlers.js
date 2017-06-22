module.exports = function (app) {
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
};