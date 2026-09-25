"use client";
export default function Error({ retry }: { retry: () => void }) {
  return <section className="discovery-notice" role="alert"><h1>Let’s try opening that again.</h1><p>Your saved practice is safe.</p><button type="button" className="discovery-button" onClick={retry}>Try again</button></section>;
}
