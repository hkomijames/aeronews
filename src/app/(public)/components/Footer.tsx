
export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white py-6">
      <div className="container mx-auto px-4">
        <p className="text-center">
          &copy; {new Date().getFullYear()} Aero Saga. All rights reserved.
        </p>
      </div>
    </footer>
  );
}