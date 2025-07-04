const { createNotification, deleteNotifications } = require("../lib/notifications");
const prisma = require("../utils/prisma");

async function userFriends(userId) {
  try {
    const userData = await prisma.user.findUnique({  
      where: {
        id: userId,
      },
      include: {
        // actual friends
        friends: {
          select: {
            friend: {
              include: {
                friends: true,
                posts: true,
                pointHistory: true,
              },
            },
          },
        },
        // friends who sent friend requests to the user
        receivedRequests: {
          select: {
            sender: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
        // friends who received friend requests from the user
        sentRequests: {
          select: {
            receiver: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    userData.friends = userData.friends.map(entry => {
      const friend = entry.friend;
      const totalPoints = friend.pointHistory?.reduce((sum, p) => sum + p.points, 0) || 0;

      return {
        friend: {
          ...friend,
          totalPoints,
        }
      };
    });

    return userData;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function isFriend({ senderId, receiverId }) {
  try {
    if (!senderId || !receiverId) {
      return {
        message: "Missing sender or receiver ID",
        isFriend: false,
      };
    }

    // Check if they are already friends
    const accepted = await prisma.friendRequest.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (accepted) {
      return {
        message: "Friends",
        isFriend: true,
        status: accepted.status,
        senderUsername: accepted.sender.username,
        receiverUsername: accepted.receiver.username,
      };
    }

    // Check if a request has been sent or received (but not accepted yet)
    const sentRequest = await prisma.friendRequest.findFirst({
      where: {
        senderId,
        receiverId,
        status: "PENDING",
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (sentRequest) {
      return {
        message: "Friend request sent",
        isFriend: false,
        state: 'SENT',
        status: sentRequest.status,
        senderUsername: sentRequest.sender.username,
        receiverUsername: sentRequest.receiver.username,
      };
    }

    const receivedRequest = await prisma.friendRequest.findFirst({
      where: {
        senderId: receiverId,
        receiverId: senderId,
        status: "PENDING",
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (receivedRequest) {
      return {
        message: "Friend request received",
        isFriend: false,
        state: 'RECEIVED',
        status: receivedRequest.status,
        senderUsername: receivedRequest.receiver.username,
        receiverUsername: receivedRequest.sender.username,
      };
    }

    // Default fallback: no relationship
    return {
      message: "No friend request found",
      isFriend: false,
      status: null,
      state: null,
    };
  } catch (e) {
    console.error("Error in isFriend controller:", e.stack);
    return {
      message: "Internal server error",
      isFriend: false,
    };
  }
}

async function sentRequests(userId) {
  try {
    const result = await prisma.user.findUnique({
      where: {
        userId,
      },
      include: {
        sentRequests: {
          where: { 
            status: "PENDING" 
          },
          include: {
            receiver: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    return result;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function receivedRequests(userId) {
  try {
    const result = await prisma.user.findUnique({
      where: {
        userId,
      },
      include: {
        receivedRequests: {
          where: { 
            status: "PENDING" 
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    return result;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function updateRequestNotification(id, notificationId) {
  return await prisma.friendRequest.update({
    where: {
      id
    },
    data: {
      notificationId
    }
  });
}

async function sentRequest(value) {
  try {
    const { senderId, receiverId } = value;
    
    const response = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: "PENDING",
      },
      include: {
        receiver: true,
        sender: true
      }
    });

    console.log("SW - response on sent request: ", response);
    
    const notification = await createNotification({
      userId: response?.receiver?.id,
      type: "FRIEND_REQUEST",
      url: `/user/${response?.receiver?.id}`,
      content: `${response?.sender.username} has sent you a friend request`,
    });

    await updateRequestNotification(response.id, notification?.id);
    
    return !!response;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

// Function to update friend request status
async function updateFriendRequestStatus(id) {
  return await prisma.friendRequest.update({
    where: { 
      id 
    },
    data: { 
      status: "ACCEPTED" 
    },
    include : {
      sender: true,
      receiver: true,
    }
  });
}

// Function to create a friendship between two users
async function createFriendship(senderId, receiverId) {
  await prisma.friendship.createMany({
    data: [
      { 
        userId: senderId, 
        friendId: receiverId 
      },
      { 
        userId: receiverId, 
        friendId: senderId 
      },
    ],
  });
}

async function acceptRequest(value) {
  try {
    const { senderId, receiverId } = value;

    console.log("SW what is the senderId: ", senderId);
    console.log("SW what is the receiverId: ", receiverId);

    const requestResponse = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: senderId,
            receiverId: receiverId,
            status: 'PENDING'
          },
          {
            senderId: receiverId,
            receiverId: senderId,
            status: 'PENDING'
          },
        ],
      }
    })

    const request = await updateFriendRequestStatus(requestResponse?.id);

    if (!request) {
      return false;
    }

    // Create Friendships
    await createFriendship(senderId, receiverId);

    const requestAcceptedBody = {
      type: "FRIEND_REQUEST_ACCEPTED",
      requestId: request.id,
    };

    // Notify the sender when the request is accepted
    await createNotification({
      ...requestAcceptedBody,
      userId: request.sender.id,
      url: `/user/${request.receiver.id}`,
      content: `${request.receiver.username} has accepted your friend request`,
    });

    // Notify the receiver when the request is accepted
    await createNotification({
      ...requestAcceptedBody,
      userId: request.receiver.id,
      url: `/user/${request.sender.id}`,
      content: `you are now friend with ${request.sender.username}`,
    });

    return true;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

async function cancelRequest(value) {
  try {
    const { senderId, receiverId } = value;

    const request = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId,
            receiverId,
            status: { not: "DECLINED" },
          },
          {
            senderId: receiverId,
            receiverId: senderId,
            status: { not: "DECLINED" },
          },
        ],
      },
    });

    const response = await deleteRequest(request?.id);

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          {
            userId: senderId,
            friendId: receiverId,
          },
          {
            userId: receiverId,
            friendId: senderId,
          },
        ],
      },
    });

    if (existingFriendship) {
      await deleteFriendship(senderId, receiverId);
    }

    return response ?? null; // return 'DECLINED' or null
  } catch (e) {
    console.error("Error in cancelRequest:", e.stack);
    return null;
  }
}

async function deleteFriendship(userId, friendId) {
  try {
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { 
            userId, 
            friendId 
          },
          { 
            userId: friendId, 
            friendId: userId 
          },
        ],
      },
    });

    return true; 
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

async function deleteRequest(id) {
  try {
    const response = await prisma.friendRequest.update({
      where: { 
        id 
      },
      data: { 
        status: "DECLINED" 
      },
      include: {
        notification: true
      }
    });

    console.log("SW - response on delete request: ", response);

    await deleteNotifications([response.notificationId]);
    return response?.status;
  } catch (e) {
    console.log("Error: ", e.stack);
    return '';
  }
}

module.exports = {
  userFriends,
  sentRequests,
  receivedRequests,
  sentRequest,
  acceptRequest,
  deleteFriendship,
  deleteRequest,
  cancelRequest,
  isFriend
};
