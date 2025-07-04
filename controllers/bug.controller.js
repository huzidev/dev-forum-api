const { BugReportStatus } = require("@prisma/client");
const prisma = require("../utils/prisma");

// Post bug
async function reportBug(values) {
  try {
    const response = await prisma.bugReport.create({
      data: {
        ...values,
      },
    });

    return response ? true : false;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

// Get reported bugs by user
async function getReportedBugsByUser(userId) {
  try {
    const response = await prisma.bugReport.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return [];
  }
}

// Admin level functions

// Get all reported bugs
async function getReportedBugs() {
  try {
    console.log("SW reported bugs called");

    const response = await prisma.bugReport.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return [];
  }
}

// Get bug report details by id
async function getReportedBugById(id) {
  try {
    const response = await prisma.bugReport.findUnique({
      where: {
        id
      },
      include: {
        user: true,
      }
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

// Update bug status
async function updateBugStatus(values) {
  try {
    const { reportedBugId, status, comment } = values;

    const reportedBug = await getReportedBugById(reportedBugId);

    if (!reportedBug) {
      return null;
    }

    const response = await prisma.bugReport.update({
      where: {
        id: reportedBugId
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

module.exports = {
  reportBug,
  getReportedBugsByUser,
  getReportedBugs,
  getReportedBugById,
  updateBugStatus
};
