import * as AdminController from "../controllers/admin";
import { adminContract } from "@typeuz/contracts/admin";
import { initServer } from "@ts-rest/express";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(adminContract, {
  test: {
    handler: async (r) => callController(AdminController.test)(r),
  },
  toggleBan: {
    handler: async (r) => callController(AdminController.toggleBan)(r),
  },
  deleteUser: {
    handler: async (r) => callController(AdminController.deleteUser)(r),
  },
  clearStreakHourOffset: {
    handler: async (r) =>
      callController(AdminController.clearStreakHourOffset)(r),
  },
  acceptReports: {
    handler: async (r) => callController(AdminController.acceptReports)(r),
  },
  rejectReports: {
    handler: async (r) => callController(AdminController.rejectReports)(r),
  },
  sendForgotPasswordEmail: {
    handler: async (r) =>
      callController(AdminController.sendForgotPasswordEmail)(r),
  },
  getAnalytics: {
    handler: async (r) => callController(AdminController.getAnalytics)(r),
  },
  searchUsers: {
    handler: async (r) => callController(AdminController.searchUsers)(r),
  },
  getActivity: {
    handler: async (r) => callController(AdminController.getActivity)(r),
  },
  sendNotification: {
    handler: async (r) => callController(AdminController.sendNotification)(r),
  },
  getAdConfig: {
    handler: async (r) => callController(AdminController.getAdConfig)(r),
  },
  updateAdConfig: {
    handler: async (r) => callController(AdminController.updateAdConfig)(r),
  },
  addCreative: {
    handler: async (r) => callController(AdminController.addCreative)(r),
  },
  deleteCreative: {
    handler: async (r) => callController(AdminController.deleteCreative)(r),
  },
  getSiteContent: {
    handler: async (r) => callController(AdminController.getSiteContent)(r),
  },
  updateSiteContent: {
    handler: async (r) => callController(AdminController.updateSiteContent)(r),
  },
  getThemeSettings: {
    handler: async (r) => callController(AdminController.getThemeSettings)(r),
  },
  updateThemeSettings: {
    handler: async (r) =>
      callController(AdminController.updateThemeSettings)(r),
  },
  getSignupsByDay: {
    handler: async (r) => callController(AdminController.getSignupsByDay)(r),
  },
  getLoginsByDay: {
    handler: async (r) => callController(AdminController.getLoginsByDay)(r),
  },
  getLoginsByWeek: {
    handler: async (r) => callController(AdminController.getLoginsByWeek)(r),
  },
  getDau: {
    handler: async (r) => callController(AdminController.getDau)(r),
  },
  getRetention: {
    handler: async (r) => callController(AdminController.getRetention)(r),
  },
  getWpmDistribution: {
    handler: async (r) => callController(AdminController.getWpmDistribution)(r),
  },
  getTopUsers: {
    handler: async (r) => callController(AdminController.getTopUsers)(r),
  },
  getUserGrowth: {
    handler: async (r) => callController(AdminController.getUserGrowth)(r),
  },
  getNotifications: {
    handler: async (r) => callController(AdminController.getNotifications)(r),
  },
  getLegalContent: {
    handler: async (r) => callController(AdminController.getLegalContent)(r),
  },
  updateLegalContent: {
    handler: async (r) => callController(AdminController.updateLegalContent)(r),
  },
  listUsers: {
    handler: async (r) => callController(AdminController.listUsers)(r),
  },
});
