const express = require("express");
const LikeList = require("../models/likeListSchema");
const { likeListSchema } = require("../schemas.js");
const AppError = require("../utils/AppError");
const wrapAsync = require("../utils/wrapAsync");
const router = express.Router();
const mongoose = require("mongoose")

// ----------- HELPERS -------------

const d = new Date();
const date = d.toDateString();

const validateLike = (req, res, next) => {

  const { error } = likeListSchema.validate(req.body);

  if (error) {
    const msg = error.details.map(el => el.message).join(",");
    next(new AppError(400, msg))
  } else {
    next();
  }
}

// ----------- LIKE LIST -------------

const categories = ["Eat/Drink", "Experience", "Watch", "Learn"];
const ratings = [0, 1, 2, 3, 4, 5]

// SHOW ALL LIKES
router.get("/", wrapAsync(async (req, res, next) => {
  const likeList = await LikeList.find();
  console.log(likeList);
  res.render("likelist.ejs", { likeList, date });
}, 404, "Page Not Found"));


// ADD NEW LIKE
router.get("/new", (req, res, next) => {
  res.render("likeListNew.ejs", { categories, ratings, date });
});

router.post("/", validateLike, wrapAsync(async (req, res, next) => {
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
router.get("/:id", wrapAsync((async (req, res, next) => {
  const { id } = req.params;
  console.log(id);
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
router.get("/edit/:id", wrapAsync((async (req, res, next) => {
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

router.put("/:id", validateLike, wrapAsync((async (req, res, next) => {
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
router.delete("/:id", wrapAsync((async (req, res, next) => {
  const { id } = req.params;
  await LikeList.findByIdAndDelete(id);
  res.redirect("/likelist");
}), 400, "Could Not Delete Entry"));

module.exports = router;
