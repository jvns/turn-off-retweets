
// load dependencies
var express = require('express')
var Sequelize = require('sequelize')
var session = require('express-session');

// initalize sequelize with session store
var SequelizeStore = require('connect-session-sequelize')(session.Store);
// create database, ensure 'sqlite3' in your package.json
var sequelize = new Sequelize(
"database",
"username",
"password", {
    "dialect": "sqlite",
    "storage": ".data/session.sqlite"
});

var store = new SequelizeStore({
    db: sequelize
  });
store.sync();


module.exports = {
  sql_session: session({
  secret: 'keyboard cat',
  store: store,
  proxy: true // if you do SSL outside of node.
})
}
