import { useRef, useEffect, useState, useCallback, MutableRefObject } from 'react';

// Types
interface ScrollableOptions {
  enableSmoothScrolling?: boolean;
  customScrollbarStyles?: boolean;
  preventHorizontalScroll?: boolean;
  scrollThreshold?: number;
  autoHideScrollButtons?: boolean;
  saveScrollPosition?: boolean;
}

interface ScrollableReturn {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToElement: (elementId: string) => void;
  scrollToPosition: (position: number) => void;
  isScrollable: boolean;
  scrollPosition: number;
  scrollPercentage: number;
  isAtTop: boolean;
  isAtBottom: boolean;
}

interface HotReloadStorage {
  [key: string]: any;
}

// Storage keys
const SCROLL_POSITIONS_KEY = 'app_scroll_positions';
const HOT_RELOAD_DATA_KEY = 'app_hot_reload_data';

// Hot reload storage utility
class HotReloadStorage {
  private static getData(): { [key: string]: any } {
    try {
      const data = localStorage.getItem(HOT_RELOAD_DATA_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private static setData(data: { [key: string]: any }): void {
    try {
      localStorage.setItem(HOT_RELOAD_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save hot reload data:', error);
    }
  }

  static get(key: string): any {
    const data = this.getData();
    return data[key];
  }

  static set(key: string, value: any): void {
    const data = this.getData();
    data[key] = value;
    this.setData(data);
  }

  static remove(key: string): void {
    const data = this.getData();
    delete data[key];
    this.setData(data);
  }

  static clear(): void {
    try {
      localStorage.removeItem(HOT_RELOAD_DATA_KEY);
    } catch (error) {
      console.warn('Failed to clear hot reload data:', error);
    }
  }
}

// Scroll position utilities
class ScrollPositionManager {
  private static getPositions(): { [key: string]: number } {
    try {
      const data = localStorage.getItem(SCROLL_POSITIONS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private static setPositions(positions: { [key: string]: number }): void {
    try {
      localStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
    } catch (error) {
      console.warn('Failed to save scroll positions:', error);
    }
  }

  static save(pageId: string, position: number): void {
    const positions = this.getPositions();
    positions[pageId] = position;
    this.setPositions(positions);
  }

  static get(pageId: string): number {
    const positions = this.getPositions();
    return positions[pageId] || 0;
  }

  static remove(pageId: string): void {
    const positions = this.getPositions();
    delete positions[pageId];
    this.setPositions(positions);
  }
}

// Main scrollable hook
export const useScrollable = (
  options: ScrollableOptions = {},
  pageId?: string
): ScrollableReturn => {
  const {
    enableSmoothScrolling = true,
    customScrollbarStyles = false,
    preventHorizontalScroll = false,
    scrollThreshold = 100,
    autoHideScrollButtons = false,
    saveScrollPosition = true,
  } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Check if container is scrollable
  const checkScrollable = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      const scrollable = container.scrollHeight > container.clientHeight;
      setIsScrollable(scrollable);
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    setScrollPosition(scrollTop);
    
    // Calculate percentage
    const maxScroll = scrollHeight - clientHeight;
    const percentage = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    setScrollPercentage(percentage);
    
    // Check positions
    setIsAtTop(scrollTop < scrollThreshold);
    setIsAtBottom(scrollTop > maxScroll - scrollThreshold);

    // Save scroll position if pageId is provided
    if (pageId && saveScrollPosition) {
      ScrollPositionManager.save(pageId, scrollTop);
    }
  }, [pageId, saveScrollPosition, scrollThreshold]);

  // Scroll functions
  const scrollToTop = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: enableSmoothScrolling ? 'smooth' : 'auto',
      });
    }
  }, [enableSmoothScrolling]);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: enableSmoothScrolling ? 'smooth' : 'auto',
      });
    }
  }, [enableSmoothScrolling]);

  const scrollToElement = useCallback((elementId: string) => {
    const container = containerRef.current;
    const element = document.getElementById(elementId);
    
    if (container && element) {
      const elementTop = element.offsetTop;
      const containerTop = container.offsetTop;
      const scrollTop = elementTop - containerTop - 20; // 20px offset
      
      container.scrollTo({
        top: scrollTop,
        behavior: enableSmoothScrolling ? 'smooth' : 'auto',
      });
    }
  }, [enableSmoothScrolling]);

  const scrollToPosition = useCallback((position: number) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: position,
        behavior: enableSmoothScrolling ? 'smooth' : 'auto',
      });
    }
  }, [enableSmoothScrolling]);

  // Setup container and event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Apply custom scrollbar styles
    if (customScrollbarStyles) {
      container.style.scrollbarWidth = 'thin';
      container.style.scrollbarColor = '#888 #f1f1f1';
      
      // Add webkit scrollbar styles
      const styleId = 'scrollable-webkit-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .scrollable-container::-webkit-scrollbar {
            width: 8px;
          }
          .scrollable-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .scrollable-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          .scrollable-container::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `;
        document.head.appendChild(style);
      }
      container.classList.add('scrollable-container');
    }

    // Prevent horizontal scroll if requested
    if (preventHorizontalScroll) {
      container.style.overflowX = 'hidden';
    }

    // Add scroll event listener
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial checks
    checkScrollable();
    handleScroll();

    // Set up ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(() => {
      checkScrollable();
      handleScroll();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll, checkScrollable, customScrollbarStyles, preventHorizontalScroll]);

  return {
    containerRef,
    scrollToTop,
    scrollToBottom,
    scrollToElement,
    scrollToPosition,
    isScrollable,
    scrollPosition,
    scrollPercentage,
    isAtTop,
    isAtBottom,
  };
};

// Hot reload hook for state preservation
export function useHotReload<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize state from stored value or initial value
  const [state, setState] = useState<T>(() => {
    const storedValue = HotReloadStorage.get(key);
    return storedValue !== undefined ? storedValue : initialValue;
  });

  // Custom setter that also saves to storage
  const setStateWithStorage = useCallback((value: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value;
      HotReloadStorage.set(key, newValue);
      return newValue;
    });
  }, [key]);

  // Clear function
  const clearState = useCallback(() => {
    HotReloadStorage.remove(key);
    setState(initialValue);
  }, [key, initialValue]);

  return [state, setStateWithStorage, clearState];
}

// Hook for scroll position restoration
export const useScrollRestore = (pageId: string) => {
  return useCallback((containerRef: MutableRefObject<HTMLDivElement | null>) => {
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Restore scroll position after a short delay to ensure content is rendered
      const timeoutId = setTimeout(() => {
        const savedPosition = ScrollPositionManager.get(pageId);
        if (savedPosition > 0) {
          container.scrollTo({
            top: savedPosition,
            behavior: 'auto', // Use auto for restoration to avoid animation
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }, []);
  }, [pageId]);
};

// Utility functions for manual usage
export const ScrollableUtils = {
  // Save current scroll position
  saveScrollPosition: (pageId: string, position: number) => {
    ScrollPositionManager.save(pageId, position);
  },

  // Get saved scroll position
  getScrollPosition: (pageId: string): number => {
    return ScrollPositionManager.get(pageId);
  },

  // Clear saved scroll position
  clearScrollPosition: (pageId: string) => {
    ScrollPositionManager.remove(pageId);
  },

  // Save arbitrary data for hot reload
  saveHotReloadData: (key: string, data: any) => {
    HotReloadStorage.set(key, data);
  },

  // Get hot reload data
  getHotReloadData: (key: string): any => {
    return HotReloadStorage.get(key);
  },

  // Clear hot reload data
  clearHotReloadData: (key: string) => {
    HotReloadStorage.remove(key);
  },

  // Clear all stored data
  clearAllData: () => {
    HotReloadStorage.clear();
    localStorage.removeItem(SCROLL_POSITIONS_KEY);
  },
};

// Enhanced page detection for automatic cleanup
export const usePageCleanup = (pageId: string) => {
  useEffect(() => {
    // Cleanup function that runs when component unmounts
    return () => {
      // Optional: Clear scroll position when leaving page
      // ScrollPositionManager.remove(pageId);
    };
  }, [pageId]);
};

// Hook for development mode detection
export const useDevMode = () => {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // Detect development mode
    const isDev = process.env.NODE_ENV === 'development' || 
                  window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1';
    setIsDevMode(isDev);
  }, []);

  return isDevMode;
};