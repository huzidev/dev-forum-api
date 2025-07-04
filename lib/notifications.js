const prisma = require("../utils/prisma");

async function createNotification(data) {
  try {
    const { userId, type, url, content } = data;
    
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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
    console.log("Error creating notification:", e.stack);
    return null;
  }
}

async function deleteNotifications(ids) {
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
    console.error("Error deleting notifications:", e.stack);
    return null;
  }
}

module.exports = {
  createNotification,
  deleteNotifications
};
