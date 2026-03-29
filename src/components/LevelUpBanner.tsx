import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

interface LevelUpBannerProps {
  title: string;
  onDone?: () => void;
}

const LevelUpBanner = ({ title, onDone }: LevelUpBannerProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[110] animate-fade-in">
      <div className="bg-green-500 text-white py-3 px-4 text-center flex items-center justify-center gap-2 shadow-lg">
        <Shield className="w-5 h-5" />
        <span className="font-bold">Level Up!</span>
        <span>You are now a {title}</span>
      </div>
    </div>
  );
};

export default LevelUpBanner;
