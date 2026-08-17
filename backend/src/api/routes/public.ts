import { publicContract } from "@typeuz/contracts/public";
import { initServer } from "@ts-rest/express";
import * as PublicController from "../controllers/public";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(publicContract, {
  getSpeedHistogram: {
    handler: async (r) => callController(PublicController.getSpeedHistogram)(r),
  },
  getTypingStats: {
    handler: async (r) => callController(PublicController.getTypingStats)(r),
  },
  getAdConfig: {
    handler: async (r) => callController(PublicController.getPublicAdConfig)(r),
  },
  getSiteContent: {
    handler: async (r) => callController(PublicController.getSiteContent)(r),
  },
  submitFeedback: {
    handler: async (r) => (callController(PublicController.submitFeedback) as any)(r),
  },
});
