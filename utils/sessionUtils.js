// ----------- SESSION MANAGEMENT -------------
const MongoStore = require('connect-mongo');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/newsApp'
const secret = process.env.SECRET || 'thisshouldbeabettersecret!'

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
      secret
  }
});

store.on("error", function(e) {
  console.log("SESSION STORE ERROR", error);
})

const sessionConfig = {
  store,
  secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: Date.now() + (1000 * 60 * 60 * 24 * 7), // expires in 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}

module.exports = { sessionConfig, dbUrl };
