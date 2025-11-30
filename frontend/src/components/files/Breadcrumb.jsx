import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import { Home, NavigateNext, Folder } from '@mui/icons-material';

/**
 * Breadcrumb Component
 * Shows current folder path with navigation
 */
export default function Breadcrumb({ path, onNavigate }) {
    return (
        <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ fontSize: '0.875rem' }}
        >
            {/* Home / Root */}
            <Link
                component="button"
                underline="hover"
                color="inherit"
                onClick={() => onNavigate(null)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    '&:hover': {
                        color: 'primary.main',
                    },
                }}
            >
                <Home fontSize="small" />
                <span>My Files</span>
            </Link>

            {/* Path segments */}
            {path && path.map((segment, index) => {
                const isLast = index === path.length - 1;

                if (isLast) {
                    return (
                        <Typography
                            key={index}
                            color="text.primary"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                fontWeight: 500,
                            }}
                        >
                            <Folder fontSize="small" />
                            {segment.name}
                        </Typography>
                    );
                }

                return (
                    <Link
                        key={index}
                        component="button"
                        underline="hover"
                        color="inherit"
                        onClick={() => onNavigate(segment.id)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'pointer',
                            '&:hover': {
                                color: 'primary.main',
                            },
                        }}
                    >
                        <Folder fontSize="small" />
                        {segment.name}
                    </Link>
                );
            })}
        </Breadcrumbs>
    );
}
