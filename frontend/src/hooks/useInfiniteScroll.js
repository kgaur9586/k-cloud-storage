import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for infinite scroll functionality
 * @param {Function} callback - Function to call when user scrolls to bottom
 * @param {boolean} hasMore - Whether there are more items to load
 * @param {boolean} loading - Whether currently loading
 * @returns {Function} Ref callback to attach to last element
 */
export function useInfiniteScroll(callback, hasMore, loading) {
    const observer = useRef();

    const lastElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                callback();
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore, callback]);

    return lastElementRef;
}
