const prisma = require("../utils/prisma");
const { getUserById } = require("./user.controller");

async function getPlans() {
  try {
    const response = await prisma.plan.findMany({
      include: {
        benefits: true,
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function getPlan(id) {
  try {
    const response = await prisma.plan.findUnique({
      where: {
        id,
      },
      include: {
        benefits: true,
      },
    });

    return response;
  } catch (e) {
    console.log("Error :", e.stack);
    return null;
  }
}

async function buyPlan(planId, userId) {
  try {
    const userExists = await getUserById(userId);

    if (!userExists) {
      return false;
    }

    const planExists = await getPlan(planId);

    if (!planExists) {
      return false;
    }

    const response = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        PlanId: planId
      }
    });

    return !!response;
  } catch (e) {
    console.log("Error :", e.stack);
    return false;
  }
}

// Admin level functions

async function createPlan(values) {
  try {
    const response = await prisma.plan.create({
      data: {
        title: values.title,
        info: values.info,
        price: values.price,
        benefits: {
          create: values.benefits?.map((benefit) => ({ 
            description: typeof benefit === 'string' ? benefit : benefit.description 
          })),
        },
      },
    });

    return !!response;
  } catch (e) {
    console.error("Error:", e.message);
    return false;
  }
}

async function updatePlan(values) {
  try {
    console.log("SW values for updatePlan", values);

    const { id, title, info, price, benefits } = values;
    const existingPlan = await getPlan(id);

    if (!existingPlan) {
      return null;
    }

    const existingBenefits = existingPlan.benefits.map((b) => b.description);
    const newBenefits = benefits || [];

    // Find benefits to delete (exist in DB but not in new data)
    const benefitsToDelete = existingPlan.benefits.filter(
      (b) => !newBenefits.some(newBenefit => {
        const description = typeof newBenefit === 'string' ? newBenefit : newBenefit.description;
        return description === b.description;
      })
    );

    // Find benefits to add (new data that doesn't exist in DB)
    const benefitsToAdd = newBenefits.filter(
      (benefit) => {
        const description = typeof benefit === 'string' ? benefit : benefit.description;
        return !existingBenefits.includes(description);
      }
    );

    // Update Plan
    const response = await prisma.plan.update({
      where: { id },
      data: {
        title,
        info,
        price: parseFloat(price),
        benefits: {
          deleteMany: {
            id: { in: benefitsToDelete.map((b) => b.id) },
          },
          create: benefitsToAdd.map((benefit) => ({ 
            description: typeof benefit === 'string' ? benefit : benefit.description 
          })),
        },
      },
    });

    return response;
  } catch (e) {
    console.error("Error:", e.message);
    return null;
  }
}

async function deletePlan(id) {
  try {
    const existingPlan = await getPlan(id);

    if (!existingPlan) {
      return null;
    }

    const response = await prisma.plan.delete({
      where: {
        id,
      },
    });

    return response;
  } catch (e) {
    console.error("Error:", e.message);
    return null;
  }
}

module.exports = {
  getPlans,
  getPlan,
  buyPlan,
  createPlan,
  updatePlan,
  deletePlan
};
