import { Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">
              HARIS <span className="text-muted-foreground font-normal text-base">هاريس</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Your AI cybersecurity guardian — حارس أمنك الرقمي
            </p>
          </div>
        </div>
        <nav className="flex gap-1">
          <NavLink
            to="/"
            className="px-4 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            activeClassName="text-foreground bg-accent"
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className="px-4 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            activeClassName="text-foreground bg-accent"
          >
            About
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Header;
