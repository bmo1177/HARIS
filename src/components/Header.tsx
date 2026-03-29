import { Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import XPBar from "@/components/XPBar";
import { useXP } from "@/lib/xpContext";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/scenarios", label: "Scenarios" },
  { to: "/voice-lab", label: "Voice Lab" },
  { to: "/about", label: "About" },
];

const Header = () => {
  const { state } = useXP();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground tracking-tight leading-none">
              HARIS <span className="text-muted-foreground font-normal text-sm">هاريس</span>
            </h1>
          </div>
        </div>

        <nav className="flex gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeClassName="text-foreground bg-accent"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0">
          <XPBar state={state} />
        </div>
      </div>
    </header>
  );
};

export default Header;
