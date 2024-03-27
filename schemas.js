const Joi = require('joi');

module.exports.likeListSchema = Joi.object({
    like: Joi.string().required(),
    category: Joi.string().valid('Eat/Drink','Experience','Watch','Learn').required(),
    description: Joi.string().allow(''),
    url: Joi.string().required(),
    urlToImage: Joi.string().required(),
    rating: Joi.number().valid(0,1,2,3,4,5).required(),
  }).required()