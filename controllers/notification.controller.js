const prisma = require("../utils/prisma");

async function getNotifications(userId, limit, offset) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    return notifications;
  } catch (e) {
    console.log("Error:", e.stack);
    return [];
  }
}

async function create(value) {
  try {
    const { userId, type, url, content } = value;
    
    const user = await prisma.user.findUnique({
      where: {
        userId,
      },
    });

    if (!user) {
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        content,
        type,
        url,
        isRead: false,
      }
    });

    return notification;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function remove(ids) {
  try {
    console.log("SW ids for delete notifications", ids);
    const response = await prisma.notification.deleteMany({
      where: { 
        id: { in: ids }, 
      },
    });
    console.log("SW response on notifications delete", response);

    return response;
  } catch (e) {
    console.error("Error:", e.stack);
    return null;
  }
}

async function markRead(id) {
  try {
    const response = await prisma.notification.update({
      where: { 
        id
      },
      data: { 
        isRead: true 
      },
    });

    console.log("SW mark notification as read", response);
    
    return !!response;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

module.exports = {
  getNotifications,
  create,
  remove,
  markRead
};
