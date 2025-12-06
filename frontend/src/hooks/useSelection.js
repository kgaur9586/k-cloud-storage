import { useState, useCallback } from 'react';

/**
 * useSelection Hook
 * Manages multi-select functionality for files and folders
 * 
 * Features:
 * - Single item selection
 * - Multi-select with Ctrl/Cmd+Click
 * - Range selection with Shift+Click
 * - Select all / Clear all
 */
export default function useSelection(items = []) {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

    /**
     * Toggle selection for a single item
     */
    const toggleSelection = useCallback((id, index, event) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);

            // Shift+Click: Range selection
            if (event?.shiftKey && lastSelectedIndex !== null) {
                const start = Math.min(lastSelectedIndex, index);
                const end = Math.max(lastSelectedIndex, index);

                for (let i = start; i <= end; i++) {
                    if (items[i]) {
                        newSet.add(items[i].id);
                    }
                }
            }
            // Ctrl/Cmd+Click: Toggle individual (explicit)
            else if (event?.ctrlKey || event?.metaKey) {
                if (newSet.has(id)) {
                    newSet.delete(id);
                } else {
                    newSet.add(id);
                }
            }
            // Regular click: Toggle this item (add if not selected, remove if selected)
            else {
                if (newSet.has(id)) {
                    newSet.delete(id);
                } else {
                    newSet.add(id);
                }
            }

            return newSet;
        });

        setLastSelectedIndex(index);
    }, [items, lastSelectedIndex]);

    /**
     * Check if an item is selected
     */
    const isSelected = useCallback((id) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    /**
     * Select all items
     */
    const selectAll = useCallback(() => {
        setSelectedIds(new Set(items.map(item => item.id)));
    }, [items]);

    /**
     * Clear all selections
     */
    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        setLastSelectedIndex(null);
    }, []);

    /**
     * Select specific items by IDs
     */
    const selectItems = useCallback((ids) => {
        setSelectedIds(new Set(ids));
    }, []);

    /**
     * Get array of selected IDs
     */
    const getSelectedIds = useCallback(() => {
        return Array.from(selectedIds);
    }, [selectedIds]);

    /**
     * Get array of selected items
     */
    const getSelectedItems = useCallback(() => {
        return items.filter(item => selectedIds.has(item.id));
    }, [items, selectedIds]);

    return {
        selectedIds: Array.from(selectedIds),
        selectedCount: selectedIds.size,
        isSelected,
        toggleSelection,
        selectAll,
        clearSelection,
        selectItems,
        getSelectedIds,
        getSelectedItems,
        hasSelection: selectedIds.size > 0,
    };
}
