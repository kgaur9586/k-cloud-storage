import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Alert,
} from '@mui/material';

/**
 * User Profile Modal
 * Collects user details after first-time Logto authentication
 */
export function UserProfileModal({ open, onSubmit, email, isLoading }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        age: '',
        gender: '',
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!email && !formData.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else {
            // Basic phone validation
            const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
            if (!phoneRegex.test(formData.phone)) {
                newErrors.phone = 'Invalid phone number format';
            }
        }

        if (formData.age && (parseInt(formData.age) < 13 || parseInt(formData.age) > 120)) {
            newErrors.age = 'Age must be between 13 and 120';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const submitData = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
            };

            if (!email) {
                submitData.email = formData.email.trim();
            } else {
                submitData.email = email;
            }

            if (formData.age) {
                submitData.age = parseInt(formData.age);
            }

            if (formData.gender) {
                submitData.gender = formData.gender;
            }

            onSubmit(submitData);
        }
    };

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
        >
            <DialogTitle>
                <Typography variant="h5" component="div" fontWeight={600}>
                    Complete Your Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Please provide your details to continue
                </Typography>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2.5}>
                        {email ? (
                            <Alert severity="info" sx={{ mb: 1 }}>
                                Email: <strong>{email}</strong>
                            </Alert>
                        ) : (
                            <TextField
                                label="Email Address"
                                name="email"
                                value={formData.email || ''}
                                onChange={handleChange}
                                error={!!errors.email}
                                helperText={errors.email}
                                required
                                fullWidth
                                placeholder="your@email.com"
                            />
                        )}

                        <TextField
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={!!errors.name}
                            helperText={errors.name}
                            required
                            fullWidth
                            autoFocus={!!email}
                            placeholder="Enter your full name"
                        />

                        <TextField
                            label="Phone Number"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            error={!!errors.phone}
                            helperText={errors.phone || 'Include country code (e.g., +1234567890)'}
                            required
                            fullWidth
                            placeholder="+1234567890"
                        />

                        <TextField
                            label="Age (Optional)"
                            name="age"
                            type="number"
                            value={formData.age}
                            onChange={handleChange}
                            error={!!errors.age}
                            helperText={errors.age || 'Must be between 13 and 120'}
                            fullWidth
                            inputProps={{ min: 13, max: 120 }}
                            placeholder="Enter your age"
                        />

                        <FormControl fullWidth>
                            <InputLabel>Gender (Optional)</InputLabel>
                            <Select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                label="Gender (Optional)"
                            >
                                <MenuItem value="">
                                    <em>Prefer not to say</em>
                                </MenuItem>
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                                <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Profile...' : 'Complete Profile'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
