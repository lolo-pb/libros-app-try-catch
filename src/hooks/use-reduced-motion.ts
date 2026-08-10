import { AccessibilityInfo } from "react-native";
import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotionEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setIsReducedMotionEnabled,
    );

    return () => subscription.remove();
  }, []);

  return isReducedMotionEnabled;
}
