import { useLogto } from '@logto/react';
import { Button } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';

/**
 * Login button component
 * Redirects to Logto sign-in page
 */
export function LoginButton() {
    const { signIn, isAuthenticated } = useLogto();

    if (isAuthenticated) {
        return null;
    }

    return (
        <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => signIn(`${window.location.origin}/callback`)}
            sx={{ px: 4, py: 1.5 }}
        >
            Sign In
        </Button>
    );
}
