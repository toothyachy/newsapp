const main = async (parameters) => {
  if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
  }
  const { dbUrl, newsApiKey, secret } = parameters;
  const express = require("express");
  const path = require("path");
  const ejsMate = require("ejs-mate");
  const methodOverride = require("method-override");
  const AppError = require("./utils/AppError");

  const d = new Date();
  const date = d.toDateString();

  const app = express();
  app.engine("ejs", ejsMate);
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  app.use(express.static(path.join(__dirname, "/public")));
  app.use(express.urlencoded({ extended: true }))
  app.use(express.json());
  app.use(methodOverride('_method'));

  // ----------- SESSION MANAGEMENT -------------
  const MongoStore = require('connect-mongo');

  const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: { secret: secret }
  });

  store.on("error", function (e) {
    console.log("SESSION STORE ERROR", error);
  })

  const sessionConfig = {
    store,
    secret: secret,
    resave: true,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      expires: Date.now() + (1000 * 60 * 60 * 24 * 7), // expires in 1 week
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  }

  // Use session middleware
  const session = require('express-session');
  app.use(session(sessionConfig));

  // ----------- MONGOOSE CONNECTION -------------
  const mongoose = require('mongoose')

  mongoose.connect(dbUrl, {})
    .then(() => {
      console.log("CONNECTION OPEN, MY LORD");
    })
    .catch(err => {
      console.log(`THERE HAS BEEN AN ERROR. PLS SEE ${err}`);
    });

  // ----------- ROUTES -------------

  const newsRoutes = require("./routes/news");
  const covidWatchRoutes = require("./routes/covidWatch");
  const likeListRoutes = require("./routes/likeList");
  app.use("/news", (req, res, next) => { req.newsApiKey = newsApiKey; next() }, newsRoutes);
  app.use("/covid-watch", (req, res, next) => { req.newsApiKey = newsApiKey; next() }, covidWatchRoutes);
  app.use("/likelist", (req, res, next) => { req.dbUrl = dbUrl; req.secret = secret; next() }, likeListRoutes);

  // ----------- THROW APPERROR EXAMPLE -------------
  app.get("/errorexample", (req, res, next) => {
    const { query } = req.query;

    // E.g. only if http://localhost:2000/errorexample?query=booboo, then AppError will be thrown

    if (query === "booboo") {
      next(new AppError(400, "AppError - You made a bad request"))
      // show our custom AppError code and message with stack trace
    } else {
      next(Error("Express-handled error"))
      // shows Express default (status code is 500, error is whatever the error was, unless specified in the bracket)
    }
  }
  )

  app.get("/chicken", (req, res) => {
    chicken.fly();
    // this doesnt have AppError defined and so the default values in the last error handler will kick in
  })

  app.get("/admin", (req, res, next) => {
    // throw new AppError(403, "AppError - You are not an Admin")
    return next(new AppError(403, "AppError - You are not an Admin"));
  })

  // ----------- NOT FOUND -------------

  app.all("*", (req, res, next) => {
    next(new AppError(404, "Page Not Found"))
  })

  app.use((err, req, res, next) => {
    const { status = 504, message = "Boo-hoo-hoo, You Did a Boo-Boo" } = err;
    res.render('notFound.ejs', { err, date })
  })

  const port = 8080
  app.listen(port, () => console.log(`YESH I'M LISTENING ON ${port}`));
};

(async () => {
  try {
    const getParameters = require("./config")
    const parameters = await getParameters();
    await main(parameters)
  } catch (err) {
    console.log(err);
  }
})()