import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
} from '@mui/material';
import QueueMonitor from '../../components/settings/QueueMonitor';

const TabPanel = ({ children, value, index }) => {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

const SettingsPage = () => {
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>

            <Paper sx={{ mt: 3 }}>
                <Tabs value={currentTab} onChange={handleTabChange}>
                    <Tab label="Queue Monitoring" />
                    <Tab label="General" disabled />
                    <Tab label="AI Features" disabled />
                </Tabs>

                <TabPanel value={currentTab} index={0}>
                    <QueueMonitor />
                </TabPanel>

                <TabPanel value={currentTab} index={1}>
                    <Typography variant="body1" color="text.secondary">
                        General settings coming soon...
                    </Typography>
                </TabPanel>

                <TabPanel value={currentTab} index={2}>
                    <Typography variant="body1" color="text.secondary">
                        AI feature configuration coming soon...
                    </Typography>
                </TabPanel>
            </Paper>
        </Container>
    );
};

export default SettingsPage;
