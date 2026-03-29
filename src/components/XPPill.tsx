import { useEffect, useState } from "react";

interface XPPillProps {
  amount: number;
  onDone?: () => void;
}

const XPPill = ({ amount, onDone }: XPPillProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-6 z-[100] animate-fade-in">
      <div className="px-4 py-2 rounded-full bg-green-500 text-white text-sm font-bold shadow-lg">
        +{amount} XP
      </div>
    </div>
  );
};

export default XPPill;
