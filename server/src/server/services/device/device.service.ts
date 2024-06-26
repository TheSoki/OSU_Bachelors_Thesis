import { BaseService, type BaseServiceDependencies } from "../base/base.service";
import type { z } from "zod";
import type { paginationSchema } from "@/server/schema/general";
import type { createDeviceSchema, updateDeviceSchema, deviceSchema } from "@/server/schema/device";
import type { InsertDevice, SelectDevice } from "@/db/schema";
import type { DeviceRepository } from "@/server/repositories/device/device.repository";

const limit = 10 as const;

const defaultColumns = {
    id: true,
    createdAt: true,
    buildingId: true,
    roomId: true,
} satisfies {
    [K in keyof SelectDevice]?: boolean;
};

export type DeviceServiceDependencies = {
    deviceRepository: DeviceRepository;
} & BaseServiceDependencies;

export class DeviceService extends BaseService {
    private deviceRepository: DeviceRepository;

    constructor(dependencies: DeviceServiceDependencies) {
        super(dependencies);

        this.deviceRepository = dependencies.deviceRepository;
    }

    async list(input: z.infer<typeof paginationSchema>) {
        const offset = (input.page - 1) * limit;

        try {
            const list = await this.deviceRepository.list({
                limit,
                offset,
                columns: {
                    ...defaultColumns,
                    lastSeen: true,
                },
                include: {
                    author: {
                        columns: { id: true, name: true },
                    },
                },
            });
            const totalCountQuery = await this.deviceRepository.totalCount();
            const totalCount = totalCountQuery[0]?.value ?? 0;
            const totalPages = Math.ceil(totalCount / limit);

            return {
                list,
                totalPages: totalPages === 0 ? 1 : totalPages,
                totalCount,
            };
        } catch (e) {
            this.logger.error(`Error fetching devices: ${e}`);

            throw new Error("Error fetching devices");
        }
    }

    async getById(input: z.infer<typeof deviceSchema>) {
        const { id } = input;
        try {
            const device = await this.deviceRepository.getById({
                id,
                columns: defaultColumns,
                include: {},
            });

            if (!device) {
                throw new Error(`No device with id '${id}'`);
            }

            return device;
        } catch (e) {
            this.logger.error(`Error fetching device with id '${id}': ${e}`);

            throw new Error(`No device with id '${id}'`);
        }
    }

    async create(input: z.infer<typeof createDeviceSchema>, userId: string): Promise<void> {
        const { buildingId, roomId } = input;

        try {
            await this.deviceRepository.create({
                buildingId,
                roomId,
                authorId: userId,
            });
        } catch (e) {
            this.logger.error(`Error adding device: ${e}`);

            throw new Error("Error adding device");
        }
    }

    async update(input: z.infer<typeof updateDeviceSchema>): Promise<void> {
        const { id, buildingId, roomId } = input;

        try {
            const data: Partial<InsertDevice> = {
                buildingId,
                roomId,
            };

            await this.deviceRepository.update(id, data);
        } catch (e) {
            this.logger.error(`Error updating device with id '${id}': ${e}`);

            throw new Error(`Error updating device with id '${id}'`);
        }
    }

    async delete(input: z.infer<typeof deviceSchema>): Promise<void> {
        const { id } = input;

        try {
            await this.deviceRepository.delete(id);
        } catch (e) {
            this.logger.error(`Error deleting device with id '${id}': ${e}`);

            throw new Error(`Error deleting device with id '${id}'`);
        }
    }

    async getDeviceToken(input: z.infer<typeof deviceSchema>) {
        const { id } = input;
        try {
            const device = await this.deviceRepository.getById({
                id,
                columns: {
                    id: true,
                    token: true,
                },
                include: {},
            });

            if (!device) {
                throw new Error(`No device with id '${id}'`);
            }

            return device;
        } catch (e) {
            this.logger.error(`Error fetching device with id '${id}': ${e}`);

            throw new Error(`No device with id '${id}'`);
        }
    }
}
