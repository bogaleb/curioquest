import { AuroraBackdrop } from "@/components/visuals/AuroraBackdrop";
import "./welcome.css";

/**
 * The frame around every account screen.
 *
 * It exists to put one backdrop behind all of them and to load `welcome.css` once.
 * Sign-in, sign-up, recovery and password-update are the same surface wearing different
 * copy, and giving each its own background would let them drift apart.
 *
 * The beam is on here and nowhere else: this is the one screen whose job is to make an
 * impression before anybody has decided to trust the product.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="aurora">
      <AuroraBackdrop variant="deep" beam/>
      {children}
    </div>
  );
}
