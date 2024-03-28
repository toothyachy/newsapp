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
const { likeListSchema } = require("./schemas.js")
const { default: axios } = require("axios");
const AppError = require("./utils/AppError");
const { nextTick } = require("process");
const { findById, findOneAndUpdate } = require("./models/articleSchema");

const app = express();
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(methodOverride('_method'));

function wrapAsync(fn, sta, msg) {
  return function (req, res, next) {
    fn(req, res, next).catch(e => {
      e.status = sta;
      e.message = msg;
      next(e);
    })
  }
}

const validateLike = (req, res, next) => {

  const { error } = likeListSchema.validate(req.body);

  if (error) {
    const msg = error.details.map(el => el.message).join(",");
    next(new AppError(400, msg))
  } else {
    next();
  }
}


mongoose.connect('mongodb://localhost:27017/newsApp', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("CONNECTION OPEN, MY LORD");
  })
  .catch(err => {
    console.log(`THERE HAS BEEN AN ERROR. PLS SEE ${err}`);
  });

const d = new Date();
const date = d.toDateString();


// NewsApi

// Surround phrases with quotes (") for exact match.
// Prepend words or phrases that must appear with a + symbol. Eg: +bitcoin
// Prepend words that must not appear with a - symbol. Eg: -bitcoin
// Alternatively you can use the AND / OR / NOT keywords, and optionally group these with parenthesis. Eg: crypto AND (ethereum OR litecoin) NOT bitcoin.


const apiKey = process.env.NEWSAPI_APIKEY;
const headlinesUrl = "https://newsapi.org/v2/top-headlines?pageSize=31&sources="
const covidUrl = "https://newsapi.org/v2/everything?searchIn=title&sortBy=relevancy&q=covid%26AND%26";
//searchIn=title or content or description?
const general = "abc-news,al-jazeera-english,associated-press,axios,bbc-news,cnn,google-news,independent,msnbc,newsweek,new-york-magazine,reddit-r-all,reuters,time,vice-news";

// let defaultImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Al_Jazeera_English_Newsdesk.jpg/1280px-Al_Jazeera_English_Newsdesk.jpg";


// -------------------- METHODS ---------------------------
const loadNews = async (url, query) => {
  let articleData = [];
  // console.log(url+query);

  try {
    const response = await axios.get(url + query, {
      headers: {
        'X-Api-Key': apiKey,
      }
    })
    console.log(response.status);
    let { articles } = response.data;

    for (let a of articles) {

      const d = a.publishedAt;
      const newd = new Date(d);
      const timeStamp = Number(newd);
      const date = newd.toDateString();
      const time = newd.toLocaleTimeString();
      const dateTime = date + "  " + time;

      let newArticle = new Article({
        source: a.source.name,
        title: a.title,
        description: a.description,
        url: a.url,
        urlToImage: a.urlToImage,
        publishedAt: dateTime,
        timeStamp: timeStamp,
        content: a.content,
      })
      articleData.push(newArticle);
    }

    articles = articleData.sort(
      (objA, objB) => objB.timeStamp - objA.timeStamp
    );
    return articles

  } catch (e) {
    console.log(e);
  }
}

loadNews(headlinesUrl, general);


const getNews = async (url, query) => {

  try {
    console.log("Hitting but not hitting");

    const articles = await loadNews(url, query);
    const carouselArticles = articles.slice(0, 3);
    const topArticle = articles[3];
    articles.splice(0, 4);

    console.log(topArticle);

    return { carouselArticles, topArticle, articles }

  } catch (e) {
    console.log(e);
  }
}

const getCovidWatch = async (url, query) => {
  try {
    const articles = await loadNews(url, query);
    const topArticle = articles[0];
    articles.splice(0, 1);

    return { topArticle, articles }

  } catch (e) {
    console.log(e);
  }
}


// ----------- NEWS PAGE -------------

app.get("/news", wrapAsync((async (req, res, next) => {
  const { carouselArticles, topArticle, articles } = await getNews(headlinesUrl, general);
  res.render("news.ejs", { carouselArticles, topArticle, articles, date })

}), 401, 'Bad Request.'))


app.post("/news", (req, res, next) => {
  const { newsQuery } = req.body;
  console.log(`POST: Req.body is ${newsQuery}`);
  try {
    res.redirect(`/news/${newsQuery}`)
  } catch (e) {
    next(e);
  }
})

app.get('/news/:newsQuery', wrapAsync((async (req, res, next) => {

  const { newsQuery } = req.params;
  console.log(`GET: Req.params is ${newsQuery}`);

  const newsQueryArray = newsQuery.split(',');

  console.log(`GET: As array is ${newsQueryArray}`);

  let sources = [];

  for (let q of newsQueryArray) {
    switch (q) {
      case "technology":
        sources.push("techradar,techcrunch,engadget,hacker-news,recode,the-next-web,the-verge,wired")
        break;
      case "business":
        sources.push("bloomberg,business-insider,business-insider-uk,financial-post,fortune,the-wall-street-journal")
        break;
      case "entertainment":
        sources.push("buzzfeed,entertainment-weekly,ign,mashable,mtv-news,polygon")
        break;
      case "health":
        sources.push("medical-news-today")
        break;
      case "science":
        sources.push("national-geographic,new-scientist,next-big-future")
        break;
      case "sports":
        sources.push("bbc-sport,bleacher-report,espn,four-four-two,fox-sports,nfl-news,talksport,the-sport-bible")
        break;
      default: console.log(q)
    }
  }

  console.log(`Selected sources are ${sources}`);

  // NOTE: I have this IF condition here bec the app keeps calling app.js or article-image in req.params. Cannot figure out why yet.
  if (newsQuery != "app.js" && newsQuery != "alt='article-image'") {
    const { carouselArticles, topArticle, articles } = await getNews(headlinesUrl, sources);
    if (articles.length == 0) {
      throw new AppError(404, "No Articles Found");
    } else {
      res.render("news.ejs", { carouselArticles, topArticle, articles, date })
      console.log(`I've finished loading results from ${sources}`);
    }
  }
}), 401, 'Bad Request.'))

// ----------- COVID WATCH -------------

app.get("/covid-watch", wrapAsync((async (req, res, next) => {
  const { topArticle, articles } = await getCovidWatch(covidUrl, "");
  res.render("covidWatch.ejs", { topArticle, articles, date })
}), 401, 'Bad Request.'))

app.post("/covid-watch", (req, res, next) => {
  let { countryQuery } = req.body;

  try {
    res.redirect(`/covid-watch/${countryQuery}`)
  } catch (error) {
    next(error);
  }
})

app.get('/covid-watch/:countryQuery', wrapAsync((async (req, res, next) => {
  const { countryQuery } = req.params;

  const { topArticle, articles } = await getCovidWatch(covidUrl, countryQuery);
  if (articles.length == 0) {
    throw new AppError(404, "No Articles Found")
  } else {
    res.render("covidWatch.ejs", { topArticle, articles, date })
  }
}), 401, 'Bad Request.'))


// ----------- LIKE LIST -------------

const categories = ["Eat/Drink", "Experience", "Watch", "Learn"];
const ratings = [0, 1, 2, 3, 4, 5]

// SHOW ALL LIKES
app.get("/likelist", wrapAsync(async (req, res, next) => {
  const likeList = await LikeList.find();
  res.render("likelist.ejs", { likeList, date });
}, 404, "Page Not Found"));


// ADD NEW LIKE
app.get("/likelist/new", (req, res, next) => {
  res.render("likeListNew.ejs", { categories, ratings, date });
});

app.post("/likelist", validateLike, wrapAsync(async (req, res, next) => {

  const { body } = req;

  let newLike = new LikeList({
    like: body.like,
    category: body.category,
    description: body.description,
    url: body.url,
    urlToImage: body.urlToImage,
    date: new Date(),
    rating: body.rating,
  });

  await newLike.save();
  console.log(newLike);
  res.redirect(`/likelist/${newLike._id}`)
}, 400, "Could Not Post Entry"))


// SHOW SPECIFIC LIKE
app.get("/likelist/:id", wrapAsync((async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError(400, "Invalid Request"));
  }
  const showLike = await LikeList.findById(id);
  if (!showLike) {
    return next(new AppError(404, "Request Not Found"));
  }
  res.render("likeListShow.ejs", { showLike, date })
})));


// EDIT SPECIFIC LIKE
app.get("/likelist/edit/:id", wrapAsync((async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError(400, "Invalid Request"));
  }
  const editLike = await LikeList.findById(id);
  if (!editLike) {
    return next(new AppError(404, "Request Not Found"));
  }
  res.render("likeListEdit.ejs", { categories, ratings, editLike, date })
})));

app.put("/likelist/:id", validateLike, wrapAsync((async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;

  let newLike = {
    like: body.like,
    category: body.category,
    description: body.description,
    url: body.url,
    urlToImage: body.urlToImage,
    date: new Date(),
    rating: body.rating,
  };

  await LikeList.findByIdAndUpdate(id, newLike, { runValidators: true, new: true });
  res.redirect(`/likelist/${id}`)

}), 400, "Could Not Edit Entry"))


// DELETE SPECIFIC LIKE
app.delete("/likelist/:id", wrapAsync((async (req, res, next) => {
  const { id } = req.params;
  await LikeList.findByIdAndDelete(id);
  console.log("Like Deleted");
  res.redirect("/likelist");
}), 400, "Could Not Delete Entry"));

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