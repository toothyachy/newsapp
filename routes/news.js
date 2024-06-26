const express = require("express");
const Article = require("../models/articleSchema");
const AppError = require("../utils/AppError");
const wrapAsync = require("../utils/wrapAsync");
const cleanUpArticles = require("../utils/cleanUpArticles")
const router = express.Router();

const d = new Date();
const date = d.toDateString();

let newsApiKey = process.env.NEWSAPI_APIKEY;
const headlinesUrl = "https://newsapi.org/v2/top-headlines?pageSize=50&sources="
const general = "abc-news,al-jazeera-english,associated-press,axios,bbc-news,cnn,google-news,independent,msnbc,newsweek,new-york-magazine,reuters,time,vice-news";


// -------------------- METHODS ---------------------------

const loadNews = async (url, query) => {
  let articleData = [];

  try {
    let response = await fetch(url + query, {
      method: "GET",
      headers: {
        "X-Api-Key": newsApiKey,
      }
    });
    response = await response.json();
    let { articles } = response;
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
    articles = await cleanUpArticles(articles)
    return articles

  } catch (e) {
    console.log(e);
  }
}

loadNews(headlinesUrl, general);


const getNews = async (url, query, apiKey) => {

  try {

    const articles = await loadNews(url, query);
    const carouselArticles = articles.slice(0, 3);
    const topArticle = articles[0];
    articles.splice(0, 1);

    return { carouselArticles, topArticle, articles }

  } catch (e) {
    console.log(e);
  }
}


// ----------- NEWS PAGE -------------

router.get("/", wrapAsync((async (req, res, next) => {
  newsApiKey = req.newsApiKey;
  const { carouselArticles, topArticle, articles } = await getNews(headlinesUrl, general);
  res.render("news.ejs", { carouselArticles, topArticle, articles, date })

}), 401, 'Bad Request.'))


router.post("/", (req, res, next) => {
  const { newsType } = req.body;
  console.log(`POST: Req.body is ${newsType}`);
  try {
    res.redirect(`/news/${newsType}`)
  } catch (e) {
    next(e);
  }
})

router.get('/:newsType', wrapAsync((async (req, res, next) => {
  newsApiKey = req.newsApiKey;
  const { newsType } = req.params;
  const newsTypeArray = newsType.split(',');

  let sources = [];

  for (let q of newsTypeArray) {
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


  // NOTE: I have this IF condition here bec the app keeps calling app.js or article-image in req.params. Cannot figure out why yet.
  if (newsType != "app.js" && newsType != "alt='article-image'") {
    const { carouselArticles, topArticle, articles } = await getNews(headlinesUrl, sources);
    if (articles.length == 0) {
      throw new AppError(404, "No Articles Found");
    } else {
      res.render("news.ejs", { carouselArticles, topArticle, articles, date })
      console.log(`I've finished loading results from ${sources}`);
    }
  }
}), 401, 'Bad Request.'))

module.exports = router;
