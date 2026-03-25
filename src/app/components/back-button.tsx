import { useNavigate, useLocation } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useLang } from "../lib/lang-context";

interface BackButtonProps {
  /** Default fallback path if no history is available (default: "/") */
  fallbackPath?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reliable back navigation button that works in iframe environments.
 * Uses location.state.from for accurate navigation instead of navigate(-1).
 */
export function BackButton({ fallbackPath = "/", className = "" }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLang();

  const handleBack = () => {
    // Use the "from" path if it was passed in state, otherwise use fallback
    const from = (location.state as any)?.from;
    if (from && typeof from === "string") {
      navigate(from);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    null
  );
}
