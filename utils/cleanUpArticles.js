const cleanUpArticles = async (articles) => {
    for (let i = 0; i < (articles.length); i++) {
        try {
            if (articles[i].source == '[Removed]') {
                articles.splice(i)
            } else {
                if (articles[i].urlToImage == null) {
                    articles[i].urlToImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Al_Jazeera_English_Newsdesk.jpg/1280px-Al_Jazeera_English_Newsdesk.jpg"
                }
            }
        } catch (err) {
            console.log(err);
        }
    }
    return articles
}

module.exports = cleanUpArticles