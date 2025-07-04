// Points values configuration
const PointsValues = {
  COMMENT: 5,
  LIKE: 2,
  REMOVE_LIKE: -2,
  CREATE_POST: 10,
  RECEIVE_COMMENT: 3,
  RECEIVE_LIKE: 1
};

// Points descriptions
const PointsDescriptions = {
  COMMENT: "Added a comment",
  RECEIVE_COMMENT: "Received a comment on your post",
  LIKE: "Liked a post",
  RECEIVE_LIKE: "Received a like on your post",
  REMOVE_LIKE: "Removed a like",
  CREATE_POST: "Created a new post"
};

module.exports = {
  PointsValues,
  PointsDescriptions
};
