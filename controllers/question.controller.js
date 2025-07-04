const prisma = require("../utils/prisma");
const { warningStatus } = require("../utils/questionStatus");

// Post question
async function askQuestion(values) {
  try {
    const response = await prisma.question.create({
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

// Post thread to a question
async function postThread(values) {
  try {
    const response = await prisma.thread.create({
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

// Edit thread of a question
async function editThread(values) {
  try {
    const { threadId, content } = values;
    const response = await prisma.thread.update({
      where: {
        id: threadId,
      },
      data: {
        content
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

// Get thread details by id
async function getThreadById(id) {
  try {
    const response = await prisma.thread.findUnique({
      where: {
        id,
      },
      include: {
        question: true
      }
    });

    if (!response) {
      return null;
    }

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function markQuestionAsAnswered(id) {
  try {
    const response = await prisma.question.update({
      where: {
        id
      },
      data: {
        status: 'ANSWERED'
      }
    });

    return response ? true : false;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

async function markThreadAsSolved(id) {
  try {
    const response = await prisma.thread.update({
      where: {
        id
      },
      data: {
        status: 'SOLUTION'
      }
    });

    return response ? true : false;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

async function markAsSolved(threadId) {
  try {
    const thread = await getThreadById(threadId);

    if (!thread || thread?.status === 'SOLUTION') {
      return false;
    }

    const questionId = thread?.questionId;

    const question = await getQuestionById(questionId);
    if (!question || question?.status === 'ANSWERED') {
      return false;
    }

    const questionAnswered = await markQuestionAsAnswered(questionId);
    const threadSolved = await markThreadAsSolved(threadId);

    if (!questionAnswered || !threadSolved) {
      return false;
    }
    return true;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

// Delete thread from a question
async function deleteThread(id) {
  try {
    const response = await prisma.thread.delete({
      where: {
        id
      }
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

// Get all questions (with optional filtering)
async function getQuestions(filterWarningStatus = true) {
  try {
    const whereClause = filterWarningStatus ? {
      status: { 
        notIn: warningStatus
      }
    } : {};

    const response = await prisma.question.findMany({
      where: whereClause,
      include: {
        user: true,
        threads: true
      }
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return [];
  }
}

// Get questions by user
async function getQuestionsByUser(userId) {
  try {
    const response = await prisma.question.findMany({
      where: {
        userId
      },
      include: {
        threads: true
      }
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return [];
  }
}

// Get question details by id
async function getQuestionById(questionId) {
  try {
    const response = await prisma.question.findUnique({
      where: {
        id: questionId
      },
      include: {
        user: true,
        threads: {
          include: {
            user: true,
          },
        },
      }
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

// Edit question
async function editQuestion(values) {
  try {
    const { questionId, title, content } = values;

    const question = await getQuestionById(questionId);

    if (!question) {
      return null;
    }

    const response = await prisma.question.update({
      where: {
        id: questionId
      },
      data: {
        status: 'UPDATED',
        title,
        content
      }
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

// Delete question
async function deleteQuestion(id) {
  try {
    const question = await getQuestionById(id);

    if (!question) {
      return false;
    }

    const response = await prisma.question.delete({
      where: {
        id
      }
    });

    console.log("SW response on delete question", response);

    return response ? true : false;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

// Admin level functions

// Update question status
async function updateQuestionStatus(values) {
  try {
    const { questionId, status, comment } = values;

    const question = await getQuestionById(questionId);

    if (!question) {
      return null;
    }

    const response = await prisma.question.update({
      where: {
        id: questionId
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
  askQuestion,
  postThread,
  editThread,
  getThreadById,
  markQuestionAsAnswered,
  markThreadAsSolved,
  markAsSolved,
  deleteThread,
  getQuestions,
  getQuestionsByUser,
  getQuestionById,
  editQuestion,
  deleteQuestion,
  updateQuestionStatus
};
