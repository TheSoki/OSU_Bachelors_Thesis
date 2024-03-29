import { db } from "@/db/connection";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getServerSession } from "next-auth/next";
import { UserRepository } from "./repositories/user/user.repository";
import { DeviceRepository } from "./repositories/device/device.repository";
import { UserService } from "./services/user/user.service";
import { DeviceService } from "./services/device/device.service";
import type { Session } from "next-auth";
import { initLogger, type Logger } from "./logger";
import { ScheduleService } from "./services/schedule/schedule.service";

export const createInnerContext = (): InnerContext => {
    const logger = initLogger();

    const userRepository = new UserRepository({ db, logger });
    const deviceRepository = new DeviceRepository({ db, logger });

    const userService = new UserService({ logger, userRepository, deviceRepository });
    const deviceService = new DeviceService({ logger, deviceRepository });
    const scheduleService = new ScheduleService({ logger, deviceRepository });

    return { logger, userService, deviceService, scheduleService };
};

export type InnerContext = {
    logger: Logger;
    userService: UserService;
    deviceService: DeviceService;
    scheduleService: ScheduleService;
};

export const createContext = async (opts: CreateNextContextOptions): Promise<Context> => {
    let innerCtx = globalThis.innerCtx;

    if (!innerCtx || process.env.NODE_ENV === "development") {
        innerCtx = createInnerContext();
        globalThis.innerCtx = innerCtx;
    }

    const { logger, userService, deviceService, scheduleService } = innerCtx;
    const session = await getServerSession(opts.req, opts.res, authOptions);

    return {
        logger,
        userService,
        deviceService,
        scheduleService,
        session,
    };
};

export type Context = InnerContext & {
    session: Session | null;
};
