/**
 * PAAT - AI Personal Assistant Agent Tool
 * Advanced Projects Management Page
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Avatar,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Divider,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Visibility as ViewIcon,
  Assignment as ProjectIcon,
  Schedule as ScheduleIcon,
  TrendingUp as ProgressIcon,
  Computer as VamshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Import services and store
import { databaseService } from '../../services/database';
import { vamshIntegrationService } from '../../services/VamshIntegrationService';
import { useAppStore } from '../../stores/appStore';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  vamsh_status: 'pending' | 'in_progress' | 'completed' | 'error';
  completion_percentage: number;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  estimated_duration?: number;
  actual_duration?: number;
  tags?: string[];
  path?: string;
}

type SortOption = 'name' | 'created_at' | 'updated_at' | 'completion_percentage' | 'priority';
type ViewMode = 'grid' | 'list';

const ProjectsPage: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Store
  const { setCurrentProject, addNotification } = useAppStore();

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Filter and sort projects when dependencies change
  useEffect(() => {
    filterAndSortProjects();
  }, [projects, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  // Load projects from database
  const loadProjects = async () => {
    try {
      setLoading(true);
      
      // For now, use mock data until database service is browser-compatible
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'E-Commerce Platform',
          description: 'Full-stack e-commerce solution with React and Node.js, featuring user authentication, product catalog, shopping cart, payment integration, and admin dashboard.',
          status: 'active',
          vamsh_status: 'in_progress',
          completion_percentage: 65,
          priority: 'high',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          estimated_duration: 120,
          actual_duration: 78,
          tags: ['React', 'Node.js', 'MongoDB', 'Stripe'],
          path: '/projects/ecommerce-platform'
        },
        {
          id: '2',
          name: 'Task Management App',
          description: 'Collaborative task management application with real-time updates, team collaboration, project tracking, and reporting features.',
          status: 'completed',
          vamsh_status: 'completed',
          completion_percentage: 100,
          priority: 'medium',
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          estimated_duration: 80,
          actual_duration: 85,
          tags: ['Vue.js', 'Express', 'PostgreSQL', 'Socket.io'],
          path: '/projects/task-manager'
        },
        {
          id: '3',
          name: 'AI Chat Interface',
          description: 'Modern chat interface with AI-powered responses, natural language processing, and context awareness for customer support.',
          status: 'active',
          vamsh_status: 'pending',
          completion_percentage: 25,
          priority: 'low',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          estimated_duration: 60,
          actual_duration: 15,
          tags: ['Python', 'FastAPI', 'OpenAI', 'Redis'],
          path: '/projects/ai-chat'
        },
        {
          id: '4',
          name: 'Mobile Fitness App',
          description: 'Cross-platform fitness tracking app with workout plans, progress tracking, social features, and health integration.',
          status: 'paused',
          vamsh_status: 'error',
          completion_percentage: 40,
          priority: 'medium',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          estimated_duration: 100,
          actual_duration: 40,
          tags: ['React Native', 'Firebase', 'HealthKit', 'GraphQL'],
          path: '/projects/fitness-app'
        },
        {
          id: '5',
          name: 'Analytics Dashboard',
          description: 'Real-time analytics dashboard with interactive charts, data visualization, and automated reporting for business intelligence.',
          status: 'active',
          vamsh_status: 'in_progress',
          completion_percentage: 80,
          priority: 'high',
          created_at: new Date(Date.now() - 345600000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString(),
          estimated_duration: 90,
          actual_duration: 72,
          tags: ['Angular', 'D3.js', 'Python', 'AWS'],
          path: '/projects/analytics-dashboard'
        }
      ];

      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      addNotification({
        type: 'error',
        title: 'Load Error',
        message: 'Failed to load projects. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort projects
  const filterAndSortProjects = () => {
    let filtered = [...projects];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(project => project.priority === priorityFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { low: 1, medium: 2, high: 3 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProjects(filtered);
  };

  // Handle project actions
  const handleProjectAction = (project: Project, action: string) => {
    setAnchorEl(null);
    
    switch (action) {
      case 'view':
        navigate(`/projects/${project.id}`);
        break;
      case 'edit':
        navigate(`/projects/${project.id}/edit`);
        break;
      case 'start':
        handleStartProject(project);
        break;
      case 'pause':
        handlePauseProject(project);
        break;
      case 'delete':
        handleDeleteProject(project);
        break;
      default:
        break;
    }
  };

  const handleStartProject = async (project: Project) => {
    try {
      // Update project status
      const updatedProjects = projects.map(p =>
        p.id === project.id
          ? { ...p, status: 'active' as const, vamsh_status: 'in_progress' as const }
          : p
      );
      setProjects(updatedProjects);
      
      addNotification({
        type: 'success',
        title: 'Project Started',
        message: `Project "${project.name}" has been started.`
      });
    } catch (error) {
      console.error('Failed to start project:', error);
      addNotification({
        type: 'error',
        title: 'Start Error',
        message: 'Failed to start project. Please try again.'
      });
    }
  };

  const handlePauseProject = async (project: Project) => {
    try {
      // Update project status
      const updatedProjects = projects.map(p =>
        p.id === project.id
          ? { ...p, status: 'paused' as const }
          : p
      );
      setProjects(updatedProjects);

      addNotification({
        type: 'info',
        title: 'Project Paused',
        message: `Project "${project.name}" has been paused.`
      });
    } catch (error) {
      console.error('Failed to pause project:', error);
      addNotification({
        type: 'error',
        title: 'Pause Error',
        message: 'Failed to pause project. Please try again.'
      });
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        const updatedProjects = projects.filter(p => p.id !== project.id);
        setProjects(updatedProjects);

        addNotification({
          type: 'success',
          title: 'Project Deleted',
          message: `Project "${project.name}" has been deleted.`
        });
      } catch (error) {
        console.error('Failed to delete project:', error);
        addNotification({
          type: 'error',
          title: 'Delete Error',
          message: 'Failed to delete project. Please try again.'
        });
      }
    }
  };

  // Handle project selection
  const handleSelectProject = (project: Project) => {
    setCurrentProject({
      id: project.id,
      name: project.name,
      path: project.path || '',
      description: project.description,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at)
    });
    navigate(`/projects/${project.id}`);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'paused':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Get Vamsh status icon
  const getVamshStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <VamshIcon color="primary" />;
      case 'completed':
        return <VamshIcon color="success" />;
      case 'error':
        return <VamshIcon color="error" />;
      default:
        return <VamshIcon color="disabled" />;
    }
  };

  // Handle menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  // Render project grid view
  const renderGridView = () => {
    const paginatedProjects = filteredProjects.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    return (
      <Grid container spacing={3}>
        {paginatedProjects.map((project, index) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: 4,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
                onClick={() => handleSelectProject(project)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
                      {project.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="Vamsh Status">
                        {getVamshStatusIcon(project.vamsh_status)}
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, project);
                        }}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '3em' }}>
                    {project.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {project.completion_percentage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={project.completion_percentage}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={project.status}
                      size="small"
                      color={getStatusColor(project.status) as any}
                    />
                    <Chip
                      label={project.priority}
                      size="small"
                      variant="outlined"
                      color={getPriorityColor(project.priority) as any}
                    />
                  </Box>

                  {project.tags && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {project.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                      {project.tags.length > 3 && (
                        <Chip
                          label={`+${project.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Updated {new Date(project.updated_at).toLocaleDateString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon fontSize="small" color="disabled" />
                      <Typography variant="caption" color="text.secondary">
                        {project.actual_duration || 0}h / {project.estimated_duration || 0}h
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render project list view
  const renderListView = () => {
    const paginatedProjects = filteredProjects.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Vamsh Status</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProjects.map((project) => (
              <TableRow
                key={project.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => handleSelectProject(project)}
              >
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {project.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.status}
                    size="small"
                    color={getStatusColor(project.status) as any}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.priority}
                    size="small"
                    variant="outlined"
                    color={getPriorityColor(project.priority) as any}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                    <LinearProgress
                      variant="determinate"
                      value={project.completion_percentage}
                      sx={{ flex: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="body2" sx={{ minWidth: 35 }}>
                      {project.completion_percentage}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title={`Vamsh: ${project.vamsh_status}`}>
                    {getVamshStatusIcon(project.vamsh_status)}
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, project);
                    }}
                  >
                    <MoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ flex: 1, p: 3, backgroundColor: 'background.default', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Projects
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage and monitor your development projects
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/projects/new')}
          size="large"
        >
          New Project
        </Button>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="disabled" sx={{ mr: 1 }} />
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Priority</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <MenuItem value="updated_at">Last Updated</MenuItem>
                  <MenuItem value="created_at">Created Date</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="completion_percentage">Progress</MenuItem>
                  <MenuItem value="priority">Priority</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}>
                  <IconButton
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    color={sortOrder === 'desc' ? 'primary' : 'default'}
                  >
                    <SortIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Grid View">
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                  >
                    <GridViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List View">
                  <IconButton
                    onClick={() => setViewMode('list')}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                  >
                    <ListViewIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {!loading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {Math.min(filteredProjects.length, rowsPerPage)} of {filteredProjects.length} projects
          </Typography>
        </Box>
      )}

      {/* Projects Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>Loading projects...</Typography>
        </Box>
      ) : filteredProjects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <ProjectIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Create your first project to get started'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/new')}
          >
            Create Project
          </Button>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? renderGridView() : renderListView()}
          
          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <TablePagination
              component="div"
              count={filteredProjects.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => selectedProject && handleProjectAction(selectedProject, 'view')}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedProject && handleProjectAction(selectedProject, 'edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Project</ListItemText>
        </MenuItem>
        <Divider />
        {selectedProject?.status === 'paused' && (
          <MenuItem onClick={() => selectedProject && handleProjectAction(selectedProject, 'start')}>
            <ListItemIcon>
              <StartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Resume Project</ListItemText>
          </MenuItem>
        )}
        {selectedProject?.status === 'active' && (
          <MenuItem onClick={() => selectedProject && handleProjectAction(selectedProject, 'pause')}>
            <ListItemIcon>
              <PauseIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Pause Project</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          onClick={() => selectedProject && handleProjectAction(selectedProject, 'delete')}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Project</ListItemText>
        </MenuItem>
      </Menu>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => navigate('/projects/new')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default ProjectsPage;
