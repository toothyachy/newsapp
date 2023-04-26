const mongoose = require("mongoose");
const {Schema} = mongoose;

const commentSchema = new Schema({
    body: String,
    rating: Number,
    timeCreated: Date, 
})

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;