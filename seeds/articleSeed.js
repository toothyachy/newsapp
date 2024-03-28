// NewsApi

// Surround phrases with quotes (") for exact match.
// Prepend words or phrases that must appear with a + symbol. Eg: +bitcoin
// Prepend words that must not appear with a - symbol. Eg: -bitcoin
// Alternatively you can use the AND / OR / NOT keywords, and optionally group these with parenthesis. Eg: crypto AND (ethereum OR litecoin) NOT bitcoin.


const apiKey = process.env.NEWSAPI_APIKEY;
// const query = "China%26AND%26covid"
const query = "covid";
const axios = require("axios");
const mongoose = require("mongoose");
const Article = require("../models/articleSchema")

mongoose.connect("mongodb://localhost:27017/newsApp", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("CONNECTION OPEN, MY LORD");
    })
    .catch(err => {
        console.log(`THERE HAS BEEN AN ERROR. PLS SEE ${err}`);
    });

let seedDB = [];


axios({
    method: "get",
    url: `https://newsapi.org/v2/everything?searchIn=title&sortBy=relevancy&q=${query}`,
    headers: {
        'X-Api-Key': apiKey,
    }
})
    .then(res => {
        Article.deleteMany({}).then(rep => { console.log(`Articles Collection Cleared`) });
        return res;
    })
    .then(res => {
        const { articles } = res.data;
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
            seedDB.push(newArticle);
            // newArticle.save().catch(e=>console.log(e));
        }

        const descSeedDB = seedDB.sort(
            (objA, objB) => objB.timeStamp - objA.timeStamp
        );

        console.log(descSeedDB);

        Article.insertMany(descSeedDB).catch(e => console.log(e));
    })
    .catch(e => console.log(e))

// seedDB().then(() => {
//     mongoose.connection.close();
// })

// const articleSchema = new Schema ({
//     source: String,
//     title: String,
//     description: String,
//     url: String,
//     urlToImage: String,
//     publishedAt: String,
//     content: String,
// });

// Given a JS object: 
//    const order = { meat: 'beef', qty: '1' }
//    const {qty, meat} = order
//    console.log(qty, meat)   // will give you “1 beef”

// Can also give a different name to the variable e.g.
//     const { meat : filling } = order
//     or const { qty : number, meat : filling } = order
//     => number = 1, filling = beef

// const seedDB = async () => {
//     await Campground.deleteMany({}); //to clear out random stuff
//     for (let i=0; i<50; i++) {
//          const random = Math.floor(Math.random()*1000);
//          const camp = new Campground ({
//               title: `${sample(descriptors)} ${sample(places)}`,
//               location: `${cities[random].city}, ${cities[random].state}`
//          });
//          await camp.save();
//    }
// } 