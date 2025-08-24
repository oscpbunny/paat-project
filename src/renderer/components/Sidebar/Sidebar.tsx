/**
 * PAAT - AI Personal Assistant Agent Tool
 * Sidebar Navigation Component (Placeholder)
 */

import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard, Assignment, MonitorHeart, Settings } from '@mui/icons-material';

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { id: 'tasks', label: 'Tasks', icon: <Assignment /> },
    { id: 'monitoring', label: 'Monitoring', icon: <MonitorHeart /> },
    { id: 'settings', label: 'Settings', icon: <Settings /> },
  ];

  return (
    <Box
      sx={{
        width: collapsed ? 60 : 240,
        height: '100%',
        backgroundColor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease-out',
      }}
    >
      {!collapsed && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
            PAAT
          </Typography>
        </Box>
      )}
      
      <List sx={{ flexGrow: 1, p: 1 }}>
        {menuItems.map((item) => (
          <ListItem 
            key={item.id} 
            sx={{ 
              borderRadius: 1, 
              mb: 0.5,
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: collapsed ? 'auto' : 40 }}>
              {item.icon}
            </ListItemIcon>
            {!collapsed && (
              <ListItemText 
                primary={item.label} 
                sx={{ ml: collapsed ? 0 : -1 }}
              />
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
