import { cn } from "lib/utils/class-name";
import React, { useEffect, useRef } from "react";

/**
 * A component that provides synchronized horizontal scrolling between two elements,
 * primarily used to create a custom scrollbar placement for tab lists.
 *
 * This is a workaround solution for scenarios where having a scrollbar at the bottom
 * of a tab list would break the UI. It creates a thin scrollbar at the top that
 * synchronizes with the content below.
 *
 * Features:
 * - Synchronized scrolling between top scrollbar and content
 * - Touch scroll support for mobile devices
 * - Dynamic width adjustment based on content
 * - Hidden native scrollbars
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes to apply to the container
 * @param {React.ReactNode} props.children - Content to be scrolled
 *
 * @example
 * ```tsx
 * <SyncedScrollView>
 *   <div>Scrollable content here...</div>
 * </SyncedScrollView>
 * ```
 */
const SyncedScrollView: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => {
  const topRef = useRef<HTMLDivElement>(null);
  const topInnerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);

  // Scroll sync
  useEffect(() => {
    const top = topRef.current;
    const content = contentRef.current;
    if (!top || !content) return;

    const syncTopToContent = () => {
      content.scrollLeft = top.scrollLeft;
    };
    const syncContentToTop = () => {
      top.scrollLeft = content.scrollLeft;
    };

    top.addEventListener("scroll", syncTopToContent);
    content.addEventListener("scroll", syncContentToTop);

    return () => {
      top.removeEventListener("scroll", syncTopToContent);
      content.removeEventListener("scroll", syncContentToTop);
    };
  }, []);

  // Resize observer to sync top width
  useEffect(() => {
    const topInner = topInnerRef.current;
    const contentInner = contentInnerRef.current;
    if (!topInner || !contentInner) return;

    const updateWidth = () => {
      topInner.style.width = `${contentInner.scrollWidth}px`;
    };

    const observer = new ResizeObserver(updateWidth);
    observer.observe(contentInner);

    // Initial width calculation
    updateWidth();

    // Handle window resize
    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // Touch scroll support for top bar
  useEffect(() => {
    const top = topRef.current;
    const content = contentRef.current;
    if (!top || !content) return;

    let startX = 0;
    let startScroll = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].pageX;
      startScroll = content.scrollLeft;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const deltaX = e.touches[0].pageX - startX;
      content.scrollLeft = startScroll - deltaX;
    };

    top.addEventListener("touchstart", handleTouchStart);
    top.addEventListener("touchmove", handleTouchMove);

    return () => {
      top.removeEventListener("touchstart", handleTouchStart);
      top.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <div className={cn("w-full", className)}>
      {/* Top Scrollbar */}
      <div ref={topRef} className="overflow-x-auto overflow-y-hidden h-3 touch-pan-x">
        <div ref={topInnerRef} className="h-[1px]" />
      </div>

      <div ref={contentRef} className="overflow-auto scrollbar-hide">
        <div ref={contentInnerRef} className="whitespace-nowrap">
          {children}
        </div>
      </div>

      {/* Custom scrollbar-hide for Chrome/Safari */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default SyncedScrollView;
