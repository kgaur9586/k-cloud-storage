import { useLogto } from '@logto/react';
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

/**
 * Logout button component
 * Signs out user and redirects to home
 */
export function LogoutButton() {
    const { signOut, isAuthenticated } = useLogto();

    if (!isAuthenticated) {
        return null;
    }

    return (
        <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={() => signOut(window.location.origin)}
        >
            Sign Out
        </Button>
    );
}
