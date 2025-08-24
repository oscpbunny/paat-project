/**
 * PAAT - AI Personal Assistant Agent Tool
 * Sidebar Navigation Component
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, IconButton, Tooltip } from '@mui/material';
import {
  Dashboard,
  Assignment,
  MonitorHeart,
  Settings,
  FolderOpen as ProjectsIcon,
  Home as HomeIcon
} from '@mui/icons-material';

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, path: '/' },
    { id: 'projects', label: 'Projects', icon: <ProjectsIcon />, path: '/projects' },
    { id: 'tasks', label: 'Tasks', icon: <Assignment />, path: '/tasks' },
    { id: 'monitoring', label: 'Monitoring', icon: <MonitorHeart />, path: '/monitoring' },
    { id: 'settings', label: 'Settings', icon: <Settings />, path: '/settings' },
  ];
  
  const handleNavigation = (path: string) => {
    navigate(path);
  };
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

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
        {menuItems.map((item) => {
          const active = isActive(item.path);
          
          if (collapsed) {
            return (
              <Tooltip key={item.id} title={item.label} placement="right">
                <ListItem
                  onClick={() => handleNavigation(item.path)}
                  sx={{ 
                    borderRadius: 1, 
                    mb: 0.5,
                    cursor: 'pointer',
                    justifyContent: 'center',
                    backgroundColor: active ? 'primary.main' : 'transparent',
                    color: active ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': { 
                      backgroundColor: active ? 'primary.dark' : 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: 'inherit', 
                      minWidth: 'auto', 
                      justifyContent: 'center'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </ListItem>
              </Tooltip>
            );
          }
          
          return (
            <ListItem 
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              sx={{ 
                borderRadius: 1, 
                mb: 0.5,
                cursor: 'pointer',
                backgroundColor: active ? 'primary.main' : 'transparent',
                color: active ? 'primary.contrastText' : 'text.primary',
                '&:hover': { 
                  backgroundColor: active ? 'primary.dark' : 'action.hover'
                }
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: 'inherit', 
                  minWidth: 40
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                sx={{ ml: -1 }}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar;
