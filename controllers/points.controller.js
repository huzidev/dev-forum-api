const prisma = require("../utils/prisma");

// Get points of the user
async function getPoints(userId) {
  try {
    const points = await prisma.pointHistory.aggregate({
      _sum: {
        points: true,
      },
      where: {
        userId,
      },
    });

    return points._sum.points || 0;
  } catch (e) {
    console.log("Error :", e.stack);
    return 0;
  }
}

// Add points for the user
async function updatePoints(values) {
  try {
    const { userId, points, type, description } = values;
    const response = await prisma.pointHistory.create({
      data: {
        userId,
        points,
        type,
        description,
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

module.exports = {
  getPoints,
  updatePoints,
};
