import Link from "next/link";
import { ShieldQuestion } from "lucide-react";
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
    author = await isCatalogueAuthor();
  } catch {
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
