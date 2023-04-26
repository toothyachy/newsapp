const mongoose = require("mongoose");
const {Schema} = mongoose;

const articleSchema = new Schema ({
    source: String,
    title: String,
    description: String,
    url: String,
    urlToImage: {
        type: String,
        default: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Al_Jazeera_English_Newsdesk.jpg/1280px-Al_Jazeera_English_Newsdesk.jpg",
    },
    publishedAt: String,
    timeStamp: Number,
    content: String,
});

const Article = mongoose.model("Article", articleSchema);
module.exports = Article;