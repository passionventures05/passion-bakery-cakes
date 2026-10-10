import BorderDivider from "@/components/BorderDivider";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import "@/styles/cart.css"; // supplies the site's CSS variables + base look
import "@/styles/legal.css";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="site page-cart page-legal">
      <Navbar />
      <main id="main" tabIndex={-1}>
        <BorderDivider />
        <article className="legal">
          <h1>{title}</h1>
          <p className="updated">Last updated: {updated}</p>
          {children}
        </article>
        <BorderDivider />
      </main>
      <Footer />
    </div>
  );
}
