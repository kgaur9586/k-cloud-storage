import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogto, useHandleSignInCallback } from '@logto/react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import { setAccessToken } from '../../services/api';
import { UserProfileModal } from '../../components/auth/UserProfileModal';

/**
 * Callback page
 * Handles OAuth callback from Logto and implements new auth flow:
 * 1. Handle Logto callback
 * 2. Wait for authentication to complete
 * 3. Try to get user from backend
 * 4. If 404 -> Show profile modal
 * 5. If 200 -> Go to dashboard
 */
export function CallbackPage() {
    const navigate = useNavigate();
    const { isAuthenticated, getIdTokenClaims, getAccessToken } = useLogto();
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);
    const [callbackHandled, setCallbackHandled] = useState(false);

    // Handle the sign-in callback
    const { isLoading: isCallbackLoading, error: callbackError } = useHandleSignInCallback(() => {
        console.log('Callback handled successfully');
        setCallbackHandled(true);
    });

    // After callback is handled, check user status
    useEffect(() => {
        if (!callbackHandled || !isAuthenticated) {
            return;
        }

        const checkUser = async () => {
            try {
                console.log('Checking user status...');

                // Wait a bit for tokens to be fully stored
                await new Promise(resolve => setTimeout(resolve, 500));

                // Get access token (no resource needed for our use case)
                const token = await getAccessToken();
                console.log('Access token available:', !!token);

                if (!token) {
                    console.error('No access token available');
                    toast.error('Failed to get access token');
                    navigate('/login');
                    return;
                }

                // Set the token in API client for all subsequent requests
                setAccessToken(token);

                // Get user claims
                const claims = await getIdTokenClaims();
                console.log('User claims:', claims);
                setUserEmail(claims?.email || '');

                // Try to get user from backend
                try {
                    console.log('Fetching user from backend...');
                    const userData = await authService.getUser();
                    console.log('User found:', userData);

                    // User exists, go to dashboard
                    toast.success('Welcome back!');
                    navigate('/dashboard');
                } catch (error) {
                    console.log('Error fetching user:', error);

                    if (error.response?.status === 404) {
                        // First-time user, show profile modal
                        console.log('First-time login detected, showing profile modal');
                        setShowProfileModal(true);
                    } else if (error.response?.status === 401) {
                        console.error('Unauthorized - token might be invalid');
                        toast.error('Authentication failed. Please try again.');
                        navigate('/login');
                    } else {
                        console.error('Error fetching user:', error);
                        toast.error('Failed to load user profile');
                        navigate('/login');
                    }
                }
            } catch (error) {
                console.error('Error checking user:', error);
                toast.error('Authentication failed');
                navigate('/login');
            }
        };

        checkUser();
    }, [callbackHandled, isAuthenticated, getIdTokenClaims, getAccessToken, navigate]);

    // Handle callback errors
    useEffect(() => {
        if (callbackError) {
            console.error('Callback error:', callbackError);
            toast.error('Authentication failed');
            navigate('/login');
        }
    }, [callbackError, navigate]);

    /**
     * Handle profile form submission
     */
    const handleProfileSubmit = async (formData) => {
        setIsCreatingProfile(true);

        try {
            console.log('Creating user profile...', formData);

            // Verify we still have a valid token
            const token = await getAccessToken();
            if (!token) {
                toast.error('Session expired. Please sign in again.');
                navigate('/login');
                return;
            }

            // Create user with profile details
            const newUser = await authService.createUser(formData);
            console.log('User created:', newUser);

            toast.success('Profile created successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating profile:', error);

            if (error.response?.status === 409) {
                toast.info('Profile already exists, redirecting...');
                navigate('/dashboard');
            } else if (error.response?.status === 401) {
                toast.error('Session expired. Please sign in again.');
                navigate('/login');
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to create profile. Please try again.');
            }
        } finally {
            setIsCreatingProfile(false);
        }
    };

    return (
        <>
            {/* Loading state while handling callback */}
            {!showProfileModal && (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="100vh"
                    gap={3}
                >
                    <CircularProgress size={60} />
                    <Typography variant="h6" color="text.secondary">
                        {isCallbackLoading ? 'Processing authentication...' : 'Signing you in...'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Please wait while we verify your account
                    </Typography>
                </Box>
            )}

            {/* Profile modal for first-time users */}
            <UserProfileModal
                open={showProfileModal}
                onSubmit={handleProfileSubmit}
                email={userEmail}
                isLoading={isCreatingProfile}
            />
        </>
    );
}
