const { createNotification } = require("../lib/notifications");
const { PointsDescriptions, PointsValues } = require("../utils/pointsConfig");
const prisma = require("../utils/prisma");
const { updatePoints } = require("./points.controller");
const { getUserById } = require("./user.controller");
const { IncomingForm, formidable } = require("formidable");
const { uploadToDigitalOcean } = require("../utils/DigitialOcean");
const fs = require("fs");

async function getPostComments(postId) {
  try {
    const response = await prisma.comment.findMany({
      where: {
        postId,
      },
      include: {
        user: true,
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return [];
  }
}

async function getUserByPostId(postId) {
  try {
    const response = await prisma.comment.findFirst({
      where: {
        postId,
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function addComment(value) {
  try {
    console.log("SW comment called with value", value);
    const { userId, postId, content } = value;
    const response = await prisma.comment.create({
      data: {
        userId,
        postId,
        content,
      },
      include: {
        user: true,
        post: {
          include: {
            author: true,
          },
        },
      },
    });

    const pointsBody = {
      points: PointsValues.COMMENT,
      type: "COMMENT",
    };

    // add points to author of the post
    await updatePoints({
      ...pointsBody,
      userId: response?.post?.author?.id,
      description: PointsDescriptions.RECEIVE_COMMENT
    });
   
    // add points to the comment writer
    await updatePoints({
      ...pointsBody,
      userId,
      description: PointsDescriptions.COMMENT
    });

    const user = await getUserById(userId);

    await createNotification({
      type: "COMMENT",
      userId: response?.post?.author?.id,
      url: `/post/${response.postId}`,
      content: `${user?.username} commented on your post`,
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function editComment(value) {
  try {
    const { commentId, content } = value;
    console.log("SW commentId for editComment", commentId);
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      return null;
    }

    const response = await prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        content,
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function deletePost(id) {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id,
      },
    });

    if (!post) {
      return null;
    }

    const response = await prisma.post.delete({
      where: {
        id,
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function deleteComment(id) {
  try {

    console.log("SW id for deleteComment", id);

    const comment = await prisma.comment.findUnique({
      where: {
        id,
      },
    });

    if (!comment) {
      return null;
    }

    const response = await prisma.comment.delete({
      where: {
        id,
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function getPostLikes(postId) {
  try {
    const response = await prisma.like.findMany({
      where: {
        postId,
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return [];
  }
}

async function checkPostLike(value) {
  try {
    const { userId, postId } = value;
    const response = await prisma.like.findFirst({
      where: {
        userId,
        postId,
      },
      include: {
        post: true
      }
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function dislikePost(values) {
  try {
    const { userId } = values;

    const likedPost = await checkPostLike(values);

    if (!likedPost) {
      return null;
    }

    const response = await prisma.like.delete({
      where: {
        id: likedPost.id,
      },
      include: {
        post: {
          include: {
            author: true,
          },
        },
      }
    });

    const pointsBody = {
      points: PointsValues.REMOVE_LIKE,
      type: "REMOVE_UPVOTE",
      description: PointsDescriptions.REMOVE_LIKE
    };

    // Update points for the author of the post 
    await updatePoints({
      ...pointsBody,
      userId: response?.post?.author?.id,
    });

    // Update points for the user who removed the like
    await updatePoints({
      ...pointsBody,
      userId,
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function likePost(value) {
  try {
    const { userId, postId } = value;

    const isLiked = await checkPostLike(value);
    if (isLiked) {
      return null;
    }

    const response = await prisma.like.create({
      data: {
        userId,
        postId,
      },
      include: {
        post: {
          include: {
            author: true,
          },
        },
      }
    });

    const user = await getUserById(userId);

    const pointsBody = {
      points: PointsValues.LIKE,
      type: "UPVOTE",
    };

    // add points to author of the post
    await updatePoints({
      ...pointsBody,
      userId: response?.post?.author?.id,
      description: PointsDescriptions.RECEIVE_LIKE
    });

    // add points to the user who liked the post
    await updatePoints({
      ...pointsBody,
      userId,
      description: PointsDescriptions.LIKE
    });

    await createNotification({
      type: "LIKE_POST",
      userId: response?.post?.author?.id,
      url: `/post/${response.postId}`,
      content: `${user?.username} liked your post`,
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function getPosts() {
  try {
    const response = await prisma.post.findMany({
      where: {
        status: {
          not: "DELETED",
        },
      },
      include: {
        author: true,
        likes: true,
        pollOptions: {
          include: {
            pollVotes: true,
          },
        },
        postImages: {
          include: {
            image: true,
          },
        },
        comments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return [];
  }
}

async function getPostById(id) {
  try {
    const response = await prisma.post.findUnique({
      where: {
        id,
      },
      include: {
        author: true,
        likes: true,
        pollOptions: {
          include: {
            pollVotes: true,
          },
        },
        postImages: {
          include: {
            image: true,
          },
        },
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function uploadPostImage(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return reject(new Error("Error parsing file"));
      }

      if (!files?.file) {
        return reject(new Error("No file uploaded"));
      }

      const postId = fields?.postId?.[0];
      const file = files.file[0];
      const filePath = file.filepath;
      const fileName = `${Date.now()}-${file.originalFilename}`;

      try {
        const params = {
          Bucket: "dev-forum-bucket",
          Key: `uploads/${fileName}`,
          Body: fs.createReadStream(filePath),
          ContentType: file.mimetype,
          ACL: "public-read",
        };

        const response = await uploadToDigitalOcean(params);

        console.log("SW response from uploadToDigitalOcean:", response);

        if (response?.data) {
          await saveImage(response.url, postId);
          resolve({ url: response.url });
        } else {
          reject(new Error("File upload failed"));
        }
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function updatePostImage(req, postId) {
  const form = formidable({ keepExtensions: true });

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) return reject(new Error("Error parsing file"));
      if (!files?.file) return reject(new Error("No file uploaded"));

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const filePath = file.filepath;
      const fileName = `${Date.now()}-${file.originalFilename}`;

      try {
        const params = {
          Bucket: "dev-forum-bucket",
          Key: `uploads/${fileName}`,
          Body: fs.createReadStream(filePath),
          ContentType: file.mimetype,
          ACL: "public-read",
        };

        const response = await uploadToDigitalOcean(params);

        if (response?.data) {
          await deletePostImage(postId);
          await saveImage(response.url, postId);
          resolve({ url: response.url });
        } else {
          reject(new Error("File upload failed"));
        }
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function getPoll(postId) {
  try {
    const response = await prisma.pollOption.findMany({
      where: {
        postId,
      },
      include: {
        pollVotes: true,
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return [];
  }
}

async function hasUserVoted(userId, postId) {
  return await prisma.pollVote.findFirst({
    where: { 
      userId, 
      postId 
    },
  });
}

// Delete the existing vote
async function deleteUserVote(voteId) {
  return await prisma.pollVote.delete({
    where: { id: voteId },
  });
}

// Create a new vote
async function createUserVote(userId, postId, pollOptionId) {
  return await prisma.pollVote.create({
    data: { 
      userId, 
      postId, 
      pollOptionId 
    },
  });
}

async function getPollOption(id) {
  return await prisma.pollOption.findUnique({
    where: { 
      id 
    },
    include: {
      pollVotes: {
        include: {
          user: true,
        },
      }
    },
  });
}

async function pollVote(values) {
  try {
    const { postId, userId, pollOptionId } = values;

    const existingVote = await hasUserVoted(userId, postId);

    if (existingVote) {
      if (existingVote?.pollOptionId === pollOptionId) {
        return null;
      }
      
      await deleteUserVote(existingVote.id);
    }

    await createUserVote(userId, postId, pollOptionId);

    const response = await getPollOption(pollOptionId);

    return response;
  } catch (e) {
    console.error("Error:", e.message);
    return null;
  }
}

async function createPoll(postId, pollOptions) {
  if (pollOptions.length === 0) return;

  await prisma.pollOption.createMany({
    data: pollOptions.map((option) => ({
      postId,
      text: option,
    })),
  });

  return;
}

async function createPost(value) {
  try {
    const { content, type, pollOptions, authorId } = value;
    const response = await prisma.post.create({
      data: {
        content,
        type,
        authorId,
      },
    });

    if (!response) return null

    if (type === "POLL") {
      await createPoll(response.id, pollOptions);
    }

    const pointsBody = {
      userId: authorId, 
      points: PointsValues.CREATE_POST, 
      type: "CREATE_POST", 
      description: PointsDescriptions.CREATE_POST 
    };

    // add points to the user who created the post
    await updatePoints(pointsBody);

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function updatePost(value) {
  try {
    const { postId, content, type, pollOptions, authorId } = value;

    const post = await getPostById(postId);

    if (!post || post.authorId !== authorId) {
      return null;
    }

    const updatedPost = await prisma.post.update({
      where: { 
        id: postId 
      },
      data: { 
        content 
      }
    });

    // Handle Poll Update
    if (type === "POLL") {
      const existingOptions = post?.pollOptions.map((opt) => opt.text);

      const hasChanges = 
        pollOptions.length !== existingOptions.length ||
        !pollOptions.every((option) => existingOptions.includes(option));

      if (hasChanges) {
        await prisma.pollOption.deleteMany({ 
          where: { 
            postId
          } 
        });

        await createPoll(postId, pollOptions);
      }
    }

    return updatedPost;
  } catch (error) {
    console.error("Error updating post:", error);
    return null;
  }
}

// Save post image to database
async function savePostImage(imageId, postId) {
  try {
    const response = await prisma.postImage.create({
      data: {
        postId,
        imageId,
      },
    });

    return response ? true : false;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

async function saveImage(imageUrl, postId) {
  try {
    const response = await prisma.image.create({
      data: {
        imageUrl,
      },
    });

    if (!response) {
      return false;
    }

    const postImage = await savePostImage(response.id, postId);

    console.log("SW what is response on postImage create", postImage);

    return response ? true : false;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

async function deletePostImage(postId) {
  try {
    const postImage = await prisma.postImage.findFirst({
      where: { postId },
    });

    if (!postImage) return true;

    await prisma.postImage.delete({ where: { id: postImage.id } });

    await prisma.image.delete({ where: { id: postImage.imageId } });

    return true;
  } catch (e) {
    console.error("Error deleting post image:", e);
    return false;
  }
}

// Admin level functions

// Update post status
async function updatePostStatus(values) {
  try {
    const { postId, status, comment } = values;

    const post = await getPostById(postId);

    if (!post) {
      return null;
    }

    const response = await prisma.post.update({
      where: {
        id: postId
      },
      data: {
        status,
        comment,
      }
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function getCommentById(id) {
  try {
    const response = await prisma.comment.findUnique({
      where: {
        id,
      },
    });

    return response ? true : false;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

// Update comment status
async function updateCommentStatus(values) {
  try {
    const { commentId, status, reason } = values;

    const comment = await getCommentById(commentId);

    if (!comment) {
      return null;
    }

    const response = await prisma.comment.update({
      where: {
        id: commentId
      },
      data: {
        status,
        reason,
      }
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

module.exports = {
  getPostComments,
  getUserByPostId,
  addComment,
  editComment,
  deletePost,
  deleteComment,
  getPostLikes,
  checkPostLike,
  dislikePost,
  likePost,
  getPosts,
  getPostById,
  getPoll,
  pollVote,
  createPost,
  updatePost,
  saveImage,
  updatePostStatus,
  getCommentById,
  updateCommentStatus,
  uploadPostImage,
  updatePostImage
};
