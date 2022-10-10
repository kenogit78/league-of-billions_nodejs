const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      // required: true,
    },
    desc: {
      type: String,
      required: true,
      max: 500,
    },
    cloudinary_id: [String],
    img: [String],
    likes: {
      type: Array,
      default: [],
    },
    comments: {
      type: Array,
      default: [],
    },
    shares: {
      type: Array,
      default: [],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'post must belong to a user'],
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: { virtuals: true },
  },
  { timestamps: true }
);

PostSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo username',
  });

  next();
});

module.exports = mongoose.model('Post', PostSchema);
