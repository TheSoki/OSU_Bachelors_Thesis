import { trpc, type RouterOutput } from "@/utils/trpc";
import { updateUserSchema } from "@/server/schema/user";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/shadcn/ui/label";
import { Input } from "@/shadcn/ui/input";
import { Button } from "@/shadcn/ui/button";
import clsx from "clsx";
import { useCallback, useEffect, useMemo } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

type ValidationSchema = z.infer<typeof updateUserSchema>;

type UserByIdOutput = RouterOutput["user"]["getById"];

type UserEditFormProps = {
    user: UserByIdOutput;
};

export const UserEditForm = ({ user }: UserEditFormProps) => {
    const utils = trpc.useUtils();
    const session = useSession();

    const updateUserMutation = trpc.user.update.useMutation({
        async onSuccess() {
            // refetches user after a user is added
            await utils.user.getById.invalidate({
                id: user.id,
            });
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty },
        reset,
    } = useForm<ValidationSchema>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: useMemo(
            () => ({
                id: user.id,
                email: user.email,
                name: user.name,
                password: "",
            }),
            [user],
        ),
    });

    useEffect(() => {
        reset({
            id: user.id,
            email: user.email,
            name: user.name,
            password: "",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const onSubmit = useCallback(
        async (data: ValidationSchema) => {
            try {
                const isUpdatedCurrentUser = user.id === session.data?.user.id;
                await updateUserMutation.mutateAsync({
                    ...data,
                    password: !!data.password ? data.password : undefined,
                });

                reset();

                if (isUpdatedCurrentUser) {
                    await signOut();
                    await signIn();
                }
            } catch (error) {
                console.error({ error }, "Failed to update user");
            }
        },
        [reset, session.data?.user.id, updateUserMutation, user.id],
    );

    return (
        <form className="mb-4 px-8 pb-8" onSubmit={handleSubmit((data) => onSubmit(data))}>
            <div className="mb-4">
                <Label htmlFor="name" className="mb-2">
                    Name
                </Label>
                <Input
                    className={clsx({
                        "border-red-500": errors.name,
                    })}
                    id="name"
                    type="text"
                    {...register("name")}
                />
                {errors.name && <p className="mt-2 text-xs italic text-red-500">{errors.name?.message}</p>}
            </div>

            <div className="mb-4">
                <Label htmlFor="email" className="mb-2">
                    Email
                </Label>
                <Input
                    className={clsx({
                        "border-red-500": errors.email,
                    })}
                    id="email"
                    type="email"
                    {...register("email")}
                />
                {errors.email && <p className="mt-2 text-xs italic text-red-500">{errors.email?.message}</p>}
            </div>

            <div className="mb-4">
                <Label htmlFor="password" className="mb-2">
                    Password
                </Label>
                <Input
                    className={clsx({
                        "border-red-500": errors.password,
                    })}
                    id="password"
                    type="password"
                    {...register("password")}
                />
                {errors.password && <p className="mt-2 text-xs italic text-red-500">{errors.password?.message}</p>}
            </div>

            <div className="mb-6 text-center">
                <Button type="submit" disabled={isSubmitting || !isDirty}>
                    Update User
                </Button>
            </div>

            {updateUserMutation.isError && <p className="text-md mt-2 text-center text-red-500">An error occurred</p>}
        </form>
    );
};
