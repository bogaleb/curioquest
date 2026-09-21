import "./welcome.css";

/**
 * The frame around every account screen.
 *
 * It exists only to load `welcome.css` once for all four of them. Sign-in, sign-up,
 * recovery and password-update are the same surface wearing different copy, and giving
 * each its own stylesheet import would let them drift apart.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
