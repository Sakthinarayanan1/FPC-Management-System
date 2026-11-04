import { Router, type IRouter } from "express";
import healthRouter from "./health";
import surveysRouter from "./surveys";
import onboardingRouter from "./onboarding";

const router: IRouter = Router();

router.use(healthRouter);
router.use(surveysRouter);
router.use(onboardingRouter);

export default router;
