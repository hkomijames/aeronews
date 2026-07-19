import Footer from "./components/Footer";
import Navbar from "./components/Navbar"; // 🚀 CLEAN STANDARD STATIC IMPORT

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Navbar renders immediately on initial server page load */}
      <Navbar />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
}
