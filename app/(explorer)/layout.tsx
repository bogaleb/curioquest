import { redirect } from "next/navigation";
import { authenticatedParent } from "@/lib/backend/context";
import { ExplorerShell } from "@/components/app/ExplorerShell";

/**
 * Every explorer route sits behind the parent account check, done once here on the
 * server rather than in each page. The shell below it is a client boundary holding
 * the shared profile state, so moving between routes never restarts a quest.
 */
export default async function ExplorerLayout({ children }: { children: React.ReactNode }) {
  if (!(await authenticatedParent())) redirect("/auth/sign-in");
  return <ExplorerShell>{children}</ExplorerShell>;
}
