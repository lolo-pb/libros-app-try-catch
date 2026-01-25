import { useCallback } from "react";

export function useNavigation() {
  const handleNavigate = useCallback((sectionId: string, screenId?: string) => {
    // Esta función puede ser expandida para manejar una navegación más compleja
    return { sectionId, screenId };
  }, []);

  return { handleNavigate };
}
