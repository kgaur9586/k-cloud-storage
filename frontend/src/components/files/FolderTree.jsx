import { useState } from 'react';
import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Folder,
    FolderOpen,
    ExpandMore,
    ChevronRight,
    Refresh,
} from '@mui/icons-material';

/**
 * FolderTreeNode Component
 * Recursive folder tree node
 */
function FolderTreeNode({ node, currentFolderId, onNavigate, level = 0 }) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.id === currentFolderId;

    const handleToggle = (e) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    const handleClick = () => {
        onNavigate(node.id);
    };

    return (
        <>
            <ListItemButton
                selected={isSelected}
                onClick={handleClick}
                sx={{
                    pl: 2 + level * 2,
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                        bgcolor: 'primary.50',
                        '&:hover': {
                            bgcolor: 'primary.100',
                        },
                    },
                }}
            >
                {hasChildren && (
                    <IconButton
                        size="small"
                        onClick={handleToggle}
                        sx={{ mr: 0.5, p: 0.5 }}
                    >
                        {expanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
                    </IconButton>
                )}

                {!hasChildren && <Box sx={{ width: 28 }} />}

                <ListItemIcon sx={{ minWidth: 32 }}>
                    {expanded ? (
                        <FolderOpen fontSize="small" color="primary" />
                    ) : (
                        <Folder fontSize="small" color="action" />
                    )}
                </ListItemIcon>

                <ListItemText
                    primary={node.name}
                    primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isSelected ? 600 : 400,
                        noWrap: true,
                    }}
                />
            </ListItemButton>

            {hasChildren && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {node.children.map((child) => (
                            <FolderTreeNode
                                key={child.id}
                                node={child}
                                currentFolderId={currentFolderId}
                                onNavigate={onNavigate}
                                level={level + 1}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
}

/**
 * FolderTree Component
 * Hierarchical folder navigation sidebar
 */
export default function FolderTree({ tree, currentFolderId, onNavigate, onRefresh }) {
    return (
        <Box>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Folder color="primary" />
                    <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Folders</Box>
                </Box>

                <Tooltip title="Refresh">
                    <IconButton size="small" onClick={onRefresh}>
                        <Refresh fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Tree */}
            <List component="nav" disablePadding>
                {tree && tree.length > 0 ? (
                    tree.map((node) => (
                        <FolderTreeNode
                            key={node.id}
                            node={node}
                            currentFolderId={currentFolderId}
                            onNavigate={onNavigate}
                        />
                    ))
                ) : (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 4,
                            color: 'text.secondary',
                            fontSize: '0.875rem',
                        }}
                    >
                        No folders yet
                    </Box>
                )}
            </List>
        </Box>
    );
}
