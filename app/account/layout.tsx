import { AuroraBackdrop } from "@/components/visuals/AuroraBackdrop";
import "./aurora-account.css";

/**
 * The frame around the account screens.
 *
 * `/account/children` is where a parent lands straight after signing in, so without
 * this the language stopped dead one screen in — a lit, moving welcome handing over to
 * a flat white panel. No beam: the impression has already been made, and this screen's
 * job is to get out of the way.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="account-aurora">
      <AuroraBackdrop variant="deep"/>
      {children}
    </div>
  );
}
