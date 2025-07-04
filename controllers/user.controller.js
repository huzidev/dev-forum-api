const prisma = require("../utils/prisma");

async function createUser(value) {
  try {
    const { userId, email, firstName, lastName, username } = value;
    const user = await prisma.user.create({
      data: {
        userId,
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        username,
      },
    });
    return user;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

// This function will return user's points
async function getUserPoints(id) {
  try {
    const user = await getUserById(id);

    if (!user) {
      return null;
    }

    const points = user?.pointHistory;

    return { 
      points, 
      totalPoints: user?.totalPoints 
    };
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function getUserByClerkId(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        userId
      }
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

// This function will return user by id
async function getUserById(id) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id
      },
      include: {
        friends: {
          include: {
            friend: {
              include: {
                friends: true,
                posts: true,
                pointHistory: true,
              },
            }
          },
        },
        pointHistory: true,
        posts: {
          include: {
            likes: true,
            comments: true,
          },
        },
        questions: true
      }
    });

    if (!user) {
      return null;
    }

    const totalPoints = user.pointHistory.reduce((sum, entry) => sum + entry.points, 0);

    return { ...user, totalPoints };
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function createUserIfNotExists(value) {
  try {
    const { userId } = value;
    const userExists = await getUserByClerkId(userId);
    console.log("SW what is values", value);

    if (userExists) {
      return { user: userExists, created: false };
    }

    const user = await createUser(value);
    return user ? { user, created: true } : null;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function updateUser(value) {
  try {
    const { userId, email, firstName, lastName, username, profilePicture } = value;
    const userExists = await getUserByClerkId(userId);

    if (!userExists) {
      // If user doesn't exist, create a new user with updated values
      await createUser(value);
      return true;
    }
    
    const user = await prisma.user.update({
      where: {
        userId,
      },
      data: {
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        username,
        profilePicture,
      },
    });
    return user ? true : false;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

async function deleteUser(userId) {
  try {
    const userExists = await getUserByClerkId(userId);

    if (!userExists) {
      return true;
    }

    const user = await prisma.user.delete({
      where: {
        userId,
      },
    });
    return user ? true : false;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

// Admin level functions

// This function will return all users from the database
async function getUsers() {
  try {
    const response = await prisma.user.findMany({
      include: {
        friends: true,
        pointHistory: true
      },
    });

    const users = response.map((user) => {
      const totalPoints = user.pointHistory.reduce((sum, entry) => sum + entry.points, 0);

      return {
        ...user,
        totalFriends: user?.friends.length,
        totalPoints,
      };
    });

    return users;
  } catch (e) {
    console.log("Error :", e.stack);
    return [];
  }
}

// This function will return all enrolled users from the database
async function getEnrolledUsers() {
  try {
    const response = await prisma.user.findMany({
      where: {
        isEnrolled: true,
      },
      include: {
        friends: true,
        pointHistory: true,
        questions: {
          include: {
            threads: true
          }
        },
      },
    });

    const users = response.map((user) => {
      const totalPoints = user.pointHistory.reduce((sum, entry) => sum + entry.points, 0);

      const solvedQuestions = user.questions.filter((question) => 
        question.status === "ANSWERED" && 
        question?.threads?.some((thread) => thread.status === "SOLUTION")
      ).length;

      console.log("SW solvedQuestions", solvedQuestions);

      return {
        ...user,
        totalFriends: user?.friends.length,
        totalPoints,
        solvedQuestions,
      };
    });

    return users;
  } catch (e) {
    console.log("Error :", e.stack);
    return [];
  }
}

// This function will return user friends
async function getUserFriends(userId) {
  try {
    const user = await getUserById(userId);
    const response = await prisma.friendship.findMany({
      where: {
        userId
      },
      include: {
        friend: {
          include: {
            pointHistory: true,
          },
        },
      },
    });

    const friends = response.map((val) => ({
      ...val.friend,
      totalPoints: val.friend.pointHistory.reduce((total, entry) => total + entry.points, 0),
      createdAt: new Date(val.createdAt).toLocaleString(),
    }));

    console.log("SW friends", friends);

    return {
      user,
      friends: friends
    };
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

// This function will update user role in Earning Program
async function updateUserRole(id, state) {
  try {
    // State will either be true or false
    const user = await prisma.user.update({
      where: {
        id
      },
      data: {
        isEnrolled: state
      }
    });

    return user ? true : false;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

// This function will ban/unban user
async function updateUserState(id, state) {
  try {
    // State will either be true or false
    const user = await prisma.user.update({
      where: {
        id
      },
      data: {
        isBan: state
      }
    });

    console.log("SW user state after state update", user);

    return user ? true : false;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

module.exports = {
  createUser,
  getUserPoints,
  getUserByClerkId,
  getUserById,
  createUserIfNotExists,
  updateUser,
  deleteUser,
  getUsers,
  getEnrolledUsers,
  getUserFriends,
  updateUserRole,
  updateUserState
};
