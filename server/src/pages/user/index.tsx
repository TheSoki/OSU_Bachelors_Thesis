import { Error } from "@/components/Error";
import { trpc } from "@/utils/trpc";
import type { NextPageWithLayout } from "../_app";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/shadcn/ui/table";
import { Skeleton } from "@/shadcn/ui/skeleton";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationLink,
    PaginationNext,
} from "@/shadcn/ui/pagination";
import { useMemo } from "react";
import { useRouter } from "next/router";
import clsx from "clsx";
import Link from "next/link";
import { match, P } from "ts-pattern";
import { DeleteUserModal } from "@/components/modals/DeleteUserModal";

const UserPage: NextPageWithLayout = () => {
    const router = useRouter();

    const queryParamPage = useMemo(() => {
        const page = Number(router.query.page);
        return isNaN(page) ? 1 : page;
    }, [router.query.page]);

    const userQuery = trpc.user.list.useQuery({ page: queryParamPage < 1 ? 1 : queryParamPage });

    if (userQuery.error) {
        return <Error title={userQuery.error.message} statusCode={userQuery.error.data?.httpStatus ?? 500} />;
    }

    if (userQuery.status === "pending") {
        return (
            <>
                {[...Array(10)].map((_, i) => (
                    <Skeleton className="mb-2 h-10" key={`device-table-skeleton-${i}`} />
                ))}
            </>
        );
    }

    const { list, page, totalPages, totalCount } = userQuery.data;

    return (
        <div className="py-8">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-3xl font-semibold">Users</h2>
                <Link href="/user/create">Create User</Link>
            </div>
            <Table>
                <TableCaption>
                    {match(totalCount)
                        .with(
                            P.when((totalCount) => totalCount === 0),
                            () => "No users",
                        )
                        .with(
                            P.when((totalCount) => totalCount === 1),
                            () => "One user",
                        )
                        .otherwise(() => `${totalCount} users`)}
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="w-[150px] text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {list.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                <Link href={`/user/${user.id}`}>{user.id}</Link>
                            </TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.createdAt.toLocaleString("cs-CZ")}</TableCell>
                            <TableCell className="text-right">
                                <Link href={`/user/${user.id}`} className="mr-2">
                                    Detail
                                </Link>

                                <DeleteUserModal id={user.id} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href={`?page=${page - 1}`}
                            className={clsx({
                                "pointer-events-none opacity-50": page === 1 || page < 0 || page > totalPages,
                            })}
                            shallow
                        />
                    </PaginationItem>

                    <PaginationItem>
                        <PaginationLink href={`?page=${page}`} className="pointer-events-none opacity-50" shallow>
                            {page}
                        </PaginationLink>
                    </PaginationItem>

                    <PaginationItem>
                        <PaginationNext
                            href={`?page=${page + 1}`}
                            className={clsx({
                                "pointer-events-none opacity-50": page === totalPages || page < 0 || page > totalPages,
                            })}
                            shallow
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
};

UserPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default UserPage;
