import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Autocomplete,
  Grid,
  Paper,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { ProjectWizardData } from '../ProjectWizard';

interface ProjectBasicsStepProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
}

const projectTypes = [
  { value: 'web-app', label: 'Web Application' },
  { value: 'mobile-app', label: 'Mobile Application' },
  { value: 'api', label: 'API/Backend Service' },
  { value: 'desktop-app', label: 'Desktop Application' },
  { value: 'library', label: 'Library/Framework' },
  { value: 'other', label: 'Other' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' },
];

const commonTechnologies = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Express',
  'Python', 'Django', 'Flask', 'TypeScript', 'JavaScript',
  'Java', 'Spring Boot', 'C#', '.NET', 'PHP', 'Laravel',
  'Ruby', 'Rails', 'Go', 'Rust', 'PostgreSQL', 'MySQL',
  'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS',
  'Azure', 'GCP', 'Git', 'CI/CD'
];

const ProjectBasicsStep: React.FC<ProjectBasicsStepProps> = ({ data, onUpdate }) => {
  const handleFieldChange = (field: keyof ProjectWizardData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onUpdate({ [field]: event.target.value });
  };

  const handleSelectChange = (field: keyof ProjectWizardData) => (
    event: any
  ) => {
    onUpdate({ [field]: event.target.value });
  };

  const handleTechnologiesChange = (newTechnologies: string[]) => {
    onUpdate({ technologies: newTechnologies });
  };

  const handleArrayFieldChange = (field: 'requirements' | 'constraints') => (
    index: number,
    value: string
  ) => {
    const newArray = [...data[field]];
    newArray[index] = value;
    onUpdate({ [field]: newArray });
  };

  const addArrayItem = (field: 'requirements' | 'constraints') => {
    const newArray = [...data[field], ''];
    onUpdate({ [field]: newArray });
  };

  const removeArrayItem = (field: 'requirements' | 'constraints') => (index: number) => {
    const newArray = data[field].filter((_, i) => i !== index);
    onUpdate({ [field]: newArray });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Project Basics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tell us about your project so we can provide the best AI-powered assistance.
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Project Name"
            value={data.name}
            onChange={handleFieldChange('name')}
            placeholder="My Awesome Project"
            required
            helperText="A clear, descriptive name for your project"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Project Type</InputLabel>
            <Select
              value={data.type}
              label="Project Type"
              onChange={handleSelectChange('type')}
            >
              {projectTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={data.priority}
              label="Priority"
              onChange={handleSelectChange('priority')}
            >
              {priorities.map((priority) => (
                <MenuItem key={priority.value} value={priority.value}>
                  <Chip 
                    label={priority.label} 
                    color={priority.color as any}
                    size="small" 
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Project Description"
            value={data.description}
            onChange={handleFieldChange('description')}
            placeholder="Describe what your project does and its main goals..."
            required
            helperText="A detailed description helps AI provide better analysis"
          />
        </Grid>

        {/* Technologies */}
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={commonTechnologies}
            freeSolo
            value={data.technologies}
            onChange={(_, newValue) => handleTechnologiesChange(newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Technologies & Tools"
                placeholder="Select or type technologies..."
                helperText="Technologies you plan to use (e.g., React, Node.js, PostgreSQL)"
              />
            )}
          />
        </Grid>

        {/* Requirements */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle1">Requirements</Typography>
              <IconButton onClick={() => addArrayItem('requirements')} size="small">
                <AddIcon />
              </IconButton>
            </Box>
            
            {data.requirements.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Click + to add requirements
              </Typography>
            ) : (
              data.requirements.map((requirement, index) => (
                <Box key={index} display="flex" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    size="small"
                    value={requirement}
                    onChange={(e) => handleArrayFieldChange('requirements')(index, e.target.value)}
                    placeholder={`Requirement ${index + 1}`}
                  />
                  <IconButton
                    onClick={() => removeArrayItem('requirements')(index)}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* Constraints */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle1">Constraints</Typography>
              <IconButton onClick={() => addArrayItem('constraints')} size="small">
                <AddIcon />
              </IconButton>
            </Box>
            
            {data.constraints.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Click + to add constraints (optional)
              </Typography>
            ) : (
              data.constraints.map((constraint, index) => (
                <Box key={index} display="flex" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    size="small"
                    value={constraint}
                    onChange={(e) => handleArrayFieldChange('constraints')(index, e.target.value)}
                    placeholder={`Constraint ${index + 1}`}
                  />
                  <IconButton
                    onClick={() => removeArrayItem('constraints')(index)}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectBasicsStep;
