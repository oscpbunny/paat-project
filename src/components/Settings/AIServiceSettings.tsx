import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Psychology as OllamaIcon,
  Engineering as VamshIcon,
  Refresh as TestIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Timer as TimerIcon,
  Link as LinkIcon,
  VisibilityOff,
  Visibility,
} from '@mui/icons-material';

import { useSettingsStore } from '../../stores/settingsStore';

const AIServiceSettings: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    testConnection, 
    testResults,
    clearTestResults
  } = useSettingsStore();
  
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Ollama settings handlers
  const handleOllamaEnabledChange = (enabled: boolean) => {
    updateSettings('aiServices.ollama.enabled', enabled);
  };
  
  const handleOllamaEndpointChange = (endpoint: string) => {
    updateSettings('aiServices.ollama.endpoint', endpoint);
  };
  
  const handleOllamaModelChange = (modelType: 'default' | 'analysis' | 'quick', model: string) => {
    updateSettings(`aiServices.ollama.models.${modelType}`, model);
  };
  
  const handleOllamaTimeoutChange = (timeout: number) => {
    updateSettings('aiServices.ollama.timeout', timeout * 1000); // Convert to milliseconds
  };
  
  // Vamsh settings handlers
  const handleVamshEnabledChange = (enabled: boolean) => {
    updateSettings('aiServices.vamsh.enabled', enabled);
  };
  
  const handleVamshEndpointChange = (endpoint: string) => {
    updateSettings('aiServices.vamsh.endpoint', endpoint);
  };
  
  const handleVamshApiKeyChange = (apiKey: string) => {
    updateSettings('aiServices.vamsh.apiKey', apiKey || undefined);
  };
  
  const handleVamshHealthIntervalChange = (interval: number) => {
    updateSettings('aiServices.vamsh.healthCheckInterval', interval);
  };
  
  const handleVamshTimeoutChange = (timeout: number) => {
    updateSettings('aiServices.vamsh.timeout', timeout * 1000); // Convert to milliseconds
  };
  
  // Connection testing
  const handleTestConnection = async (service: 'ollama' | 'vamsh') => {
    await testConnection(service);
  };
  
  // Get connection status
  const getConnectionStatus = (service: 'ollama' | 'vamsh') => {
    const result = testResults[service];
    if (!result) return null;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        {result.status === 'testing' && (
          <>
            <LinearProgress sx={{ flexGrow: 1, height: 4 }} />
            <Typography variant="caption">Testing...</Typography>
          </>
        )}
        {result.status === 'success' && (
          <>
            <SuccessIcon color="success" fontSize="small" />
            <Typography variant="caption" color="success.main">
              Connected ({result.details?.responseTime}ms)
            </Typography>
            {result.details?.models && (
              <Chip 
                label={`${result.details.models.length} models`} 
                size="small" 
                color="success"
                variant="outlined"
              />
            )}
          </>
        )}
        {result.status === 'error' && (
          <>
            <ErrorIcon color="error" fontSize="small" />
            <Typography variant="caption" color="error.main">
              {result.message || 'Connection failed'}
            </Typography>
          </>
        )}
      </Box>
    );
  };
  
  const ollamaModels = [
    'qwen2.5:7b',
    'qwen2.5:3b',
    'qwen2.5:1.5b',
    'gemma2:2b',
    'gemma2:9b',
    'llama3.1:8b',
    'llama3.1:70b',
    'mistral:7b',
    'codellama:7b',
    'phi3:3.8b',
  ];

  return (
    <Stack spacing={3}>
      {/* Ollama Configuration */}
      <Card>
        <CardHeader 
          title="Ollama AI Service" 
          subheader="Local AI models for project analysis and assistance"
          avatar={<OllamaIcon color="primary" />}
          action={
            <FormControlLabel
              control={
                <Switch
                  checked={settings.aiServices?.ollama?.enabled || false}
                  onChange={(e) => handleOllamaEnabledChange(e.target.checked)}
                />
              }
              label="Enabled"
              labelPlacement="start"
            />
          }
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Endpoint Configuration */}
            <TextField
              label="Ollama Endpoint"
              value={settings.aiServices?.ollama?.endpoint || 'http://localhost:11434'}
              onChange={(e) => handleOllamaEndpointChange(e.target.value)}
              disabled={!settings.aiServices?.ollama?.enabled}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start"><LinkIcon /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Test Connection">
                      <IconButton
                        onClick={() => handleTestConnection('ollama')}
                        disabled={!settings.aiServices?.ollama?.enabled || testResults.ollama?.status === 'testing'}
                        size="small"
                      >
                        <TestIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              helperText="Default: http://localhost:11434"
            />
            
            {getConnectionStatus('ollama')}
            
            {/* Model Configuration */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Model Configuration
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth disabled={!settings.aiServices?.ollama?.enabled}>
                  <InputLabel>Default Model</InputLabel>
                  <Select
                    value={settings.aiServices?.ollama?.models?.default || 'qwen2.5:7b'}
                    onChange={(e) => handleOllamaModelChange('default', e.target.value)}
                    label="Default Model"
                  >
                    {ollamaModels.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth disabled={!settings.aiServices?.ollama?.enabled}>
                  <InputLabel>Analysis Model</InputLabel>
                  <Select
                    value={settings.aiServices?.ollama?.models?.analysis || 'qwen2.5:7b'}
                    onChange={(e) => handleOllamaModelChange('analysis', e.target.value)}
                    label="Analysis Model"
                  >
                    {ollamaModels.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth disabled={!settings.aiServices?.ollama?.enabled}>
                  <InputLabel>Quick Response Model</InputLabel>
                  <Select
                    value={settings.aiServices?.ollama?.models?.quick || 'gemma2:2b'}
                    onChange={(e) => handleOllamaModelChange('quick', e.target.value)}
                    label="Quick Response Model"
                  >
                    {ollamaModels.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>
            
            {/* Timeout Configuration */}
            <TextField
              label="Request Timeout (seconds)"
              type="number"
              value={(settings.aiServices?.ollama?.timeout || 30000) / 1000}
              onChange={(e) => handleOllamaTimeoutChange(parseInt(e.target.value) || 30)}
              disabled={!settings.aiServices?.ollama?.enabled}
              fullWidth
              inputProps={{ min: 5, max: 300 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><TimerIcon /></InputAdornment>,
              }}
              helperText="How long to wait for Ollama responses (5-300 seconds)"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Vamsh Configuration */}
      <Card>
        <CardHeader 
          title="Vamsh AI Software Engineer" 
          subheader="Advanced AI assistant for software development"
          avatar={<VamshIcon color="primary" />}
          action={
            <FormControlLabel
              control={
                <Switch
                  checked={settings.aiServices?.vamsh?.enabled || false}
                  onChange={(e) => handleVamshEnabledChange(e.target.checked)}
                />
              }
              label="Enabled"
              labelPlacement="start"
            />
          }
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Endpoint Configuration */}
            <TextField
              label="Vamsh Endpoint"
              value={settings.aiServices?.vamsh?.endpoint || 'http://localhost:8000'}
              onChange={(e) => handleVamshEndpointChange(e.target.value)}
              disabled={!settings.aiServices?.vamsh?.enabled}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start"><LinkIcon /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Test Connection">
                      <IconButton
                        onClick={() => handleTestConnection('vamsh')}
                        disabled={!settings.aiServices?.vamsh?.enabled || testResults.vamsh?.status === 'testing'}
                        size="small"
                      >
                        <TestIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              helperText="Default: http://localhost:8000"
            />
            
            {getConnectionStatus('vamsh')}
            
            {/* API Key Configuration */}
            <TextField
              label="API Key (Optional)"
              type={showApiKey ? 'text' : 'password'}
              value={settings.aiServices?.vamsh?.apiKey || ''}
              onChange={(e) => handleVamshApiKeyChange(e.target.value)}
              disabled={!settings.aiServices?.vamsh?.enabled}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowApiKey(!showApiKey)}
                      size="small"
                    >
                      {showApiKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Leave empty if authentication is not required"
            />
            
            {/* Health Check Configuration */}
            <TextField
              label="Health Check Interval (seconds)"
              type="number"
              value={settings.aiServices?.vamsh?.healthCheckInterval || 30}
              onChange={(e) => handleVamshHealthIntervalChange(parseInt(e.target.value) || 30)}
              disabled={!settings.aiServices?.vamsh?.enabled}
              fullWidth
              inputProps={{ min: 10, max: 300 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><TimerIcon /></InputAdornment>,
              }}
              helperText="How often to check Vamsh service health (10-300 seconds)"
            />
            
            {/* Timeout Configuration */}
            <TextField
              label="Request Timeout (seconds)"
              type="number"
              value={(settings.aiServices?.vamsh?.timeout || 10000) / 1000}
              onChange={(e) => handleVamshTimeoutChange(parseInt(e.target.value) || 10)}
              disabled={!settings.aiServices?.vamsh?.enabled}
              fullWidth
              inputProps={{ min: 5, max: 120 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><TimerIcon /></InputAdornment>,
              }}
              helperText="How long to wait for Vamsh responses (5-120 seconds)"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Connection Management */}
      <Card>
        <CardHeader 
          title="Connection Management" 
          subheader="Test and manage AI service connections"
          avatar={<AIIcon color="primary" />}
        />
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => handleTestConnection('ollama')}
              disabled={!settings.aiServices?.ollama?.enabled || testResults.ollama?.status === 'testing'}
              startIcon={<TestIcon />}
            >
              Test Ollama
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleTestConnection('vamsh')}
              disabled={!settings.aiServices?.vamsh?.enabled || testResults.vamsh?.status === 'testing'}
              startIcon={<TestIcon />}
            >
              Test Vamsh
            </Button>
            <Button
              variant="text"
              onClick={clearTestResults}
              disabled={Object.keys(testResults).length === 0}
            >
              Clear Results
            </Button>
          </Stack>
          
          {Object.keys(testResults).length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Connection tests help verify that your AI services are properly configured and accessible.
              Make sure the services are running before testing connections.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card sx={{ bgcolor: 'background.default' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About AI Services
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            PAAT integrates with local AI services to provide intelligent project analysis and assistance.
            Both services run locally to ensure your data remains private and secure.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Ollama:</strong> Provides various open-source language models for different use cases.
            The default model is used for general tasks, analysis model for project analysis, 
            and quick model for fast responses.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Vamsh:</strong> An advanced AI software engineer that provides sophisticated 
            development assistance and code analysis capabilities.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default AIServiceSettings;
