const express = require("express");
const uuid = require("uuid")
const Article = require("../models/articleSchema");
const AppError = require("../utils/AppError");
const wrapAsync = require("../utils/wrapAsync");
const cleanUpArticles = require("../utils/cleanUpArticles")
const router = express.Router();

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
let messages = ""

// -------------------- METHODS ---------------------------

const loadNews = async (url, query) => {
  let articleData = [];

  try {
    let response = await fetch(url + query, {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
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

    articles = await cleanUpArticles(articles);
    // console.log(articles);
    return articles

  } catch (e) {
    console.log(e);
  }
}

loadNews(headlinesUrl, general);


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

// ----------- COVID WATCH -------------

router.get("/", wrapAsync((async (req, res, next) => {
  const { topArticle, articles } = await getCovidWatch(covidUrl, "");
  const currentMessages = messages;
  messages = ""
  res.render("covidWatch.ejs", { topArticle, articles, date, messages: currentMessages })
}), 401, 'Bad Request.'))

router.post("/", (req, res, next) => {
  let { countryQuery } = req.body;

  try {
    res.redirect(`/covid-watch/${countryQuery}`)
  } catch (error) {
    next(error);
  }
})

router.get('/:countryQuery', wrapAsync((async (req, res, next) => {
  const { countryQuery } = req.params;

  const { topArticle, articles } = await getCovidWatch(covidUrl, countryQuery);
  if (articles.length == 0) {
    messages = `No Articles Found about Covid in ${countryQuery}`
    res.redirect('/covid-watch')
  } else {
    res.render("covidWatch.ejs", { topArticle, articles, date, messages })
  }
}), 401, 'Bad Request.'))

module.exports = router;