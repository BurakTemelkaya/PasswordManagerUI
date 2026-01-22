import { useNavigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';

interface UseRouterNavigationReturn {
  navigate: ((path: string) => void) | null;
  location: Location | null;
}

/**
 * Custom hook that safely provides router navigation and location.
 * Returns null values if not in Router context (e.g., in extension popup).
 * 
 * Usage:
 * ```
 * const { navigate, location } = useRouterNavigation();
 * if (navigate) navigate('/path');
 * ```
 */
export const useRouterNavigation = (): UseRouterNavigationReturn => {
  let navigate = null;
  let location = null;

  try {
    navigate = useNavigate();
    location = useLocation();
  } catch (error) {
    // Not in Router context - likely extension popup mode
    console.log('📱 Not in Router context - returning null values');
  }

  return { navigate, location };
};
