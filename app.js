// testing push
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const uuid = require("uuid")
const mongoose = require("mongoose");
const Article = require("./models/articleSchema");
const LikeList = require("./models/likeListSchema");
const {likeListSchema} = require("./schemas.js")
const {commentSchema} = require("./models/commentSchema")
// const { default: axios } = require("axios");
const AppError = require("./utils/AppError");
const wrapAsync = require("./utils/wrapAsync");

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


// ----------- ROUTES -------------

const newsRoutes = require("./routes/news");
const covidWatchRoutes = require("./routes/covidWatch");
const likeListRoutes = require("./routes/likeList");
app.use("/news", newsRoutes);
app.use("/covid-watch", covidWatchRoutes);
app.use("/likelist", likeListRoutes);


// ----------- MONGOOSE CONNECTION -------------

mongoose.connect('mongodb://localhost:27017/newsApp', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("CONNECTION OPEN, MY LORD");
  })
  .catch(err => {
    console.log(`THERE HAS BEEN AN ERROR. PLS SEE ${err}`);
  });


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
  // res.status(status).send(`Calm down. Every mistake is a step closer to success. Error Message: ${message}`)
  res.render('notFound.ejs', { err, date })
})


app.listen(2000, () => console.log("YESH I'M LISTENING"));




// THINGS TO DO
// Change image height for carousel - try doing it at schema level