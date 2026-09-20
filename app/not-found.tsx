import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * A wrong or stale URL.
 *
 * It happens most often to a child who reopened a bookmark to a destination their parent
 * has since turned off — Faith & Bible is opt-in and server-gated — so the copy assumes
 * no fault and points at somewhere that always works. A server component: this page
 * needs no JavaScript at all.
 */
export const metadata = { title: "CurioQuest · This path went somewhere else" };

export default function NotFound() {
  return (
    <main className="cq-notfound">
      <span aria-hidden="true">🧭</span>
      <h1>This path went somewhere else</h1>
      <p>
        That page is not here any more, or it was never on the map. Nothing you made is
        lost — every discovery is safe where you left it.
      </p>
      <Link className="primary" href="/">
        <Compass size={18} />Back to my adventure
      </Link>
    </main>
  );
}
