// enhancedStyles.ts

export const enhancedStyles = `
/* Enhanced Scrollable Container Styles */
.scrollable-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(136, 136, 136, 0.8) rgba(241, 241, 241, 0.5);
  scroll-behavior: smooth;
}

/* Webkit browsers (Chrome, Safari, Edge) */
.scrollable-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollable-container::-webkit-scrollbar-track {
  background: rgba(241, 241, 241, 0.5);
  border-radius: 4px;
  margin: 2px;
}

.scrollable-container::-webkit-scrollbar-thumb {
  background: rgba(136, 136, 136, 0.8);
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.scrollable-container::-webkit-scrollbar-thumb:hover {
  background: rgba(85, 85, 85, 0.9);
}

.scrollable-container::-webkit-scrollbar-corner {
  background: rgba(241, 241, 241, 0.5);
}

/* Thin scrollbar variant */
.scrollable-container.thin-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

/* Dark theme scrollbar */
.scrollable-container.dark-theme {
  scrollbar-color: rgba(255, 255, 255, 0.6) rgba(40, 40, 40, 0.8);
}

.scrollable-container.dark-theme::-webkit-scrollbar-track {
  background: rgba(40, 40, 40, 0.8);
}

.scrollable-container.dark-theme::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.6);
}

.scrollable-container.dark-theme::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.8);
}

/* Hidden scrollbar (still scrollable) */
.scrollable-container.hidden-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollable-container.hidden-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Scroll buttons styling */
.scroll-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.scroll-button {
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.scroll-button:hover {
  background: rgba(0, 123, 255, 0.2);
  border-color: rgba(0, 123, 255, 0.5);
}

.scroll-button:active {
  transform: translateY(1px);
}

.scroll-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Auto-hide scroll buttons */
.scroll-buttons.auto-hide {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.scroll-buttons.auto-hide.show {
  opacity: 1;
}

/* Loading spinner animation */
@keyframes scrollable-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.scrollable-loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(221, 221, 221, 0.8);
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: scrollable-spin 1s linear infinite;
}

/* Scroll progress indicator */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(0, 123, 255, 0.1);
  z-index: 1000;
}

.scroll-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  transition: width 0.1s ease;
}

/* Smooth scroll behavior for the entire page */
.smooth-scroll {
  scroll-behavior: smooth;
}

/* Utility classes for common scroll containers */
.scroll-y-auto {
  overflow-y: auto;
  overflow-x: hidden;
}

.scroll-x-auto {
  overflow-x: auto;
  overflow-y: hidden;
}

.scroll-both-auto {
  overflow: auto;
}

/* Responsive scroll containers */
@media (max-width: 768px) {
  .scrollable-container::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .scroll-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .scrollable-container::-webkit-scrollbar-thumb {
    background: #000;
  }
  
  .scrollable-container.dark-theme::-webkit-scrollbar-thumb {
    background: #fff;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .scrollable-container {
    scroll-behavior: auto;
  }
  
  .scroll-button,
  .scroll-progress-bar,
  .scrollable-loading-spinner {
    transition: none;
    animation: none;
  }
}
`;
