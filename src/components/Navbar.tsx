import { useState, useEffect } from "react";
import { Heart, Menu, X } from "lucide-react";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const links = [
  { href: "#home", label: "Home" },
  { href: "#gallery", label: "Gallery" },
  { href: "#notes", label: "Notes" },
  { href: "#timeline", label: "Timeline" },
  { href: "#time-together", label: "Time Together" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-strong py-3 shadow-md" : "bg-transparent py-5"
      }`}
    >
      <div className="container flex items-center justify-between">
        <a href="#home" className="flex items-center gap-2 font-script text-2xl text-romantic-deep">
          <Heart className="w-5 h-5 fill-romantic-rose text-romantic-rose" />
          S & A
        </a>
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
  {links.map((l) => (
    <a
      key={l.href}
      href={l.href}
      className="text-sm font-medium text-foreground/70 hover:text-romantic-rose transition-colors duration-200"
    >
      {l.label}
    </a>
  ))}

  <button
    onClick={() => signOut(auth)}
    className="text-sm font-medium px-4 py-1 rounded-lg border hover:bg-romantic-pink/20 transition"
  >
    Logout
  </button>
</div>
        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg hover:bg-romantic-pink/30 transition-colors"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-strong mt-2 mx-4 rounded-2xl p-4 flex flex-col gap-3 animate-reveal-up">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-foreground/70 hover:text-romantic-rose transition-colors py-2 px-3 rounded-lg hover:bg-romantic-pink/20"
            >
              {l.label}
            </a>
          ))}
          <button
             onClick={() => signOut(auth)}
            className="text-sm font-medium px-4 py-1.5 rounded-lg bg-romantic-pink/30 text-romantic-deep border border-romantic-pink/40 shadow-sm"
          >
             Logout
          </button>
        </div>
      )}
    </nav>
  );
}
