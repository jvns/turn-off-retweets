var Sequelize = require('sequelize');

var DB_PATH = '.data/database.sqlite';
function createDB() {
  var sqlite3 = require('sqlite3').verbose();
  if (require('fs').existsSync(DB_PATH)) {
    return;
  }
  if (!require('fs').existsSync('.data')) {
    require('fs').mkdirSync('.data', 0744);
  }
  console.log('hi2');
  
  db.serialize(function() {
  db.run("CREATE TABLE lorem (info TEXT)");

  var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
  for (var i = 0; i < 1; i++) {
      stmt.run("Ipsum " + i);
  }
  stmt.finalize();

})

db.close();
  console.log('hi5');
  console.log(require('fs').existsSync('.data'))

}
// default user list
var User;
// setup a new database
// using database credentials set in .env
var sequelize = new Sequelize('database', process.env.DB_USER, process.env.DB_PASS, {
  host: '0.0.0.0',
  dialect: 'sqlite',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
    // Security note: the database is saved to the file `database.sqlite` on the local filesystem. It's deliberately placed in the `.data` directory
    // which doesn't get copied if someone remixes the project.
  storage: DB_PATH
});

// authenticate with the database
sequelize.authenticate()
  .then(function(err) {
    console.log('Connection has been established successfully.');
    // define a new table 'users'
    User = sequelize.define('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING
      },
      token: {
        type: Sequelize.STRING
      },
      tokenSecret: {
        type: Sequelize.STRING
      },
    });
    createDB();
    setup();
  })
  // .catch(function (err) {
  //   console.log('Unable to connect to the database: ', err);
  // })
  
createDB();

function findById(id, cb) {
  return User.findById(id).then(function(user){
    cb(null, user);

  });
}

function findOrCreate(profile, token, tokenSecret, cb) {
  process.nextTick(function() {
    var user = {
      id: profile.id,
      username: profile.username,
      token: token,
      tokenSecret: tokenSecret
    }
    User.findOrCreate({
        where: { id: profile.id },
        defaults: user
    }).spread(function(user, created) {
      if (created) console.log('Creating user');;
      console.log(user);
      return cb(null, user);
    })
  });
}

// populate table with default users
function setup(){
  User.sync() // using 'force' it drops the table users if it already exists, and creates a new one
    .then(function(){
      // Add the default users to the database
      // for(var i=0; i<users.length; i++){ // loop through all users
      //   User.create({ firstName: users[i][0], lastName: users[i][1]}); // create a new entry in the users table
      // }

    });
}

module.exports = {
  findOrCreate: findOrCreate,
  findById: findById,
};
