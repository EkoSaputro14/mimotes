import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShellClient from "./dashboard-shell-client";

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  /** Optional max-width constraint for the content area */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
}

export default async function DashboardShell({
  children,
  title,
  maxWidth = "full",
}: DashboardShellProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShellClient
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      title={title}
      maxWidth={maxWidth}
    >
      {children}
    </DashboardShellClient>
  );
}
