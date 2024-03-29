import { z } from "zod";

export const userSchema = z.object({
    id: z.string(),
});

export const createUserSchema = z.object({
    name: z.string().min(3).max(255),
    email: z.string().email().min(3).max(255),
    password: z.string().min(3).max(255),
});

export const updateUserSchema = z.object({
    id: z.string(),
    name: z.string().min(3).max(255),
    email: z.string().email().min(3).max(255),
    password: z
        .string()
        // .min(3)
        .max(255)
        .optional()
        .refine(
            (data) => {
                // if password is not empty, it should be at least 3 characters long
                if (!data) {
                    return true;
                }
                return data.length > 2;
            },
            {
                message: "String must contain at least 3 character(s)",
            },
        ),
});

export const registerSchema = z.object({
    email: z.string().email().min(3).max(255),
    password: z.string().min(3).max(255),
});
