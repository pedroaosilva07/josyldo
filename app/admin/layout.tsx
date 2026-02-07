import { requireAdmin } from "../lib/auth";
import AdminLayoutClient from "./layout-client";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAdmin();

    return (
        <AdminLayoutClient>
            {children}
        </AdminLayoutClient>
    );
}
