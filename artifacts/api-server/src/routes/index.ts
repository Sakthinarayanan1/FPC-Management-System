import { Router, type IRouter } from "express";
import healthRouter from "./health";
import surveysRouter from "./surveys";
import onboardingRouter from "./onboarding";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(surveysRouter);
router.use(authRouter);
router.use(onboardingRouter);

export default router;
