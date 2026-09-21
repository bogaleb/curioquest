import Link from "next/link";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ShieldQuestion } from "lucide-react";
import { authenticatedParent, familyContext } from "@/lib/backend/context";
import { isCatalogueAuthor } from "@/lib/backend/repository";
import { ContentStudio } from "@/components/studio/content-studio";

export const metadata = { title: "Content studio · CurioQuest" };
/** The catalogue is live data; a cached studio would show an author their own stale work. */
export const dynamic = "force-dynamic";

/**
 * The authoring surface (blueprint §WP-05.3).
 *
 * Authorship is resolved on the server before anything renders, so a parent without a
 * grant never downloads the studio, and never sees a shell that flickers into a refusal.
 */
export default async function StudioPage() {
  let author = false;
  let reachable = true;
  try {
    /*
     * The family context has to be established here.
     *
     * `withFamily` sets it for API routes, and every other caller of the repository is
     * one. This is a server component, so nothing has run `familyContext.run` by the
     * time it asks — and `parentId()` throwing is not a `ContentError`, so it fell
     * through `isCatalogueAuthor`'s catch and came back as "the catalogue is not
     * answering". Which is to say the studio refused everybody, including a real
     * author, and blamed the database.
     *
     * The layout above has already redirected anyone unauthenticated, so this resolves.
     */
    const parent = await authenticatedParent();
    if (!parent) redirect("/auth/sign-in");
    author = await familyContext.run({ parentId: parent }, () => isCatalogueAuthor());
  } catch (error) {
    // `redirect()` works by throwing; swallowing it here would turn a redirect into a
    // "not answering" page.
    if (isRedirectError(error)) throw error;
    reachable = false;
  }

  if (!reachable) {
    return (
      <main className="studio-gate">
        <h1>The catalogue is not answering</h1>
        <p>The studio could not reach the content database. Children are unaffected — the app keeps serving the last published catalogue.</p>
        <Link className="studio-button" href="/today">Back to CurioQuest</Link>
      </main>
    );
  }

  if (!author) {
    return (
      <main className="studio-gate">
        <span className="studio-gate-mark" aria-hidden="true"><ShieldQuestion size={30}/></span>
        <h1>This account is not a catalogue author</h1>
        <p>
          The catalogue is shared by every family, so authoring is an explicit grant rather than
          something a parent account carries. Ask an administrator to add you to
          <code> content.authors</code>.
        </p>
        <Link className="studio-button" href="/today">Back to CurioQuest</Link>
      </main>
    );
  }

  return <ContentStudio/>;
}
