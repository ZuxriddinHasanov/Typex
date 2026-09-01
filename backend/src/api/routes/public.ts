import { publicContract } from "@typeuz/contracts/public";
import { initServer } from "@ts-rest/express";
import * as PublicController from "../controllers/public";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(publicContract, {
  getSpeedHistogram: {
    handler: async (r) => (callController(PublicController.getSpeedHistogram) as any)(r),
  },
  getTypingStats: {
    handler: async (r) => (callController(PublicController.getTypingStats) as any)(r),
  },
  getAdConfig: {
    handler: async (r) => (callController(PublicController.getPublicAdConfig) as any)(r),
  },
  logAdView: {
    handler: async (r) => (callController(PublicController.logAdView) as any)(r),
  },
  getSiteContent: {
    handler: async (r) => (callController(PublicController.getSiteContent) as any)(r),
  },
  submitFeedback: {
    handler: async (r) => (callController(PublicController.submitFeedback) as any)(r),
  },
});
