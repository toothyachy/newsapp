const mongoose = require ("mongoose");
const {Schema} = mongoose;

const likeListSchema = new Schema ({
    like: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ["Eat/Drink", "Experience", "Watch", "Learn"],
    },
    description: String,
    url: String,
    urlToImage: String,
    date: Date,
    rating: {
        type: Number,
        enum: [0,1,2,3,4,5],
    },
    comments: [
        {
            type: Schema.Types. ObjectId,
            ref: "Comment"    
        }
    ]
});

const LikeList = mongoose.model("LikeList", likeListSchema);
module.exports = LikeList;