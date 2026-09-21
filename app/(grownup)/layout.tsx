import { redirect } from "next/navigation";
import { authenticatedParent } from "@/lib/backend/context";
import { AuroraBackdrop } from "@/components/visuals/AuroraBackdrop";
import "./grownup.css";
// After grownup.css: that file owns the layout, this one owns ground, material and light.
import "./studio-aurora.css";

/**
 * The grown-up route group.
 *
 * Deliberately not inside `(explorer)`: the explorer shell carries a child's profile,
 * their stars and the world navigation, and a content author is none of those things.
 * A studio nested in a child's chrome would also mean every catalogue screen inherited
 * the child layer's type scale, which §D7 keeps separate for a reason — this surface is
 * dense, textual and made for a laptop.
 *
 * The account check is the same one the explorer group makes. Authorship is checked
 * further in, by the database, because being signed in is not being an author.
 */
export default async function GrownupLayout({ children }: { children: React.ReactNode }) {
  if (!(await authenticatedParent())) redirect("/auth/sign-in");
  return (
    <div className="grownup-root">
      <AuroraBackdrop variant="deep"/>
      {children}
    </div>
  );
}
