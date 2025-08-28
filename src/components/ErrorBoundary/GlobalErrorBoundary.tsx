import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  Chip,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { performanceMonitor } from '../../utils/performanceMonitor';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorReport {
  errorId: string;
  timestamp: string;
  userAgent: string;
  url: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  errorInfo: {
    componentStack: string;
  };
  appState: {
    version: string;
    buildMode: string;
    performance: any;
    localStorage: Record<string, any>;
  };
  context: {
    retryCount: number;
    lastUserAction?: string;
    routerLocation?: string;
  };
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global error caught:', error, errorInfo);
    
    // Record error in performance monitor
    performanceMonitor.recordMetric('global-error', performance.now(), {
      error: error.message,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    this.setState({
      errorInfo,
    });

    // Generate error report
    const errorReport = this.generateErrorReport(error, errorInfo);
    
    // Save error report to localStorage for later analysis
    this.saveErrorReport(errorReport);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for transient errors (up to maxRetries)
    if (this.shouldAutoRetry(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleAutoRetry();
    }
  }

  private generateErrorReport(error: Error, errorInfo: ErrorInfo): ErrorReport {
    return {
      errorId: this.state.errorId!,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo?.componentStack || 'No component stack available',
      },
      appState: {
        version: process.env.REACT_APP_VERSION || '0.1.0',
        buildMode: process.env.NODE_ENV || 'development',
        performance: performanceMonitor.generateReport(),
        localStorage: this.getLocalStorageSnapshot(),
      },
      context: {
        retryCount: this.state.retryCount,
        lastUserAction: this.getLastUserAction(),
        routerLocation: window.location.pathname,
      },
    };
  }

  private getLocalStorageSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {};
    
    try {
      // Only include non-sensitive data
      const safeKeys = ['paat-settings', 'paat-theme', 'paat-recent-projects'];
      
      safeKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            snapshot[key] = JSON.parse(value);
          } catch {
            snapshot[key] = value;
          }
        }
      });
    } catch (error) {
      snapshot._error = 'Could not access localStorage';
    }
    
    return snapshot;
  }

  private getLastUserAction(): string | undefined {
    // In a real app, this would track user actions
    return 'Unknown';
  }

  private saveErrorReport(report: ErrorReport): void {
    try {
      const existingReports = localStorage.getItem('paat-error-reports');
      const reports = existingReports ? JSON.parse(existingReports) : [];
      
      reports.push(report);
      
      // Keep only last 10 error reports
      if (reports.length > 10) {
        reports.splice(0, reports.length - 10);
      }
      
      localStorage.setItem('paat-error-reports', JSON.stringify(reports));
    } catch (error) {
      console.error('Could not save error report:', error);
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    // Auto-retry for certain types of transient errors
    const transientErrorMessages = [
      'Network Error',
      'ChunkLoadError',
      'Loading chunk failed',
      'Failed to fetch',
    ];
    
    return transientErrorMessages.some(msg => 
      error.message.includes(msg) || error.name.includes(msg)
    );
  }

  private scheduleAutoRetry(): void {
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff, max 10s
    
    this.retryTimeout = setTimeout(() => {
      this.handleRetry(true);
    }, retryDelay);
  }

  private handleRetry = (isAutoRetry = false) => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
    }));

    performanceMonitor.recordMetric('error-recovery', performance.now(), {
      type: isAutoRetry ? 'automatic' : 'manual',
      retryCount: this.state.retryCount + 1,
    });
  };

  private handleRetryClick = () => {
    this.handleRetry(false);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  private handleCopyError = () => {
    if (this.state.error && this.state.errorInfo) {
      const errorReport = this.generateErrorReport(this.state.error, this.state.errorInfo);
      const errorText = JSON.stringify(errorReport, null, 2);
      
      navigator.clipboard.writeText(errorText).then(() => {
        // Could show a toast notification here
        console.log('Error report copied to clipboard');
      }).catch(() => {
        console.warn('Could not copy error report to clipboard');
      });
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoToSettings = () => {
    window.location.href = '/#/settings';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId, retryCount } = this.state;
      const isRetryable = retryCount < this.maxRetries;

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          <Card 
            sx={{ 
              maxWidth: 600, 
              width: '100%',
              boxShadow: 4,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ErrorIcon color="error" sx={{ fontSize: 48, mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="error.main" gutterBottom>
                    Application Error
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Something unexpected happened
                  </Typography>
                </Box>
              </Box>

              {/* Error Summary */}
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>{error?.name}:</strong> {error?.message}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip 
                    label={`Error ID: ${errorId}`} 
                    size="small" 
                    variant="outlined"
                  />
                  {retryCount > 0 && (
                    <Chip 
                      label={`Retry ${retryCount}/${this.maxRetries}`} 
                      size="small" 
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Alert>

              {/* Error Details (Expandable) */}
              <Accordion sx={{ mb: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    Technical Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Error Stack:
                      </Typography>
                      <Box 
                        component="pre"
                        sx={{ 
                          fontSize: '0.75rem',
                          bgcolor: 'grey.100',
                          p: 2,
                          borderRadius: 1,
                          overflow: 'auto',
                          maxHeight: 200,
                        }}
                      >
                        {error?.stack || 'No stack trace available'}
                      </Box>
                    </Box>
                    
                    {errorInfo && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Component Stack:
                        </Typography>
                        <Box 
                          component="pre"
                          sx={{ 
                            fontSize: '0.75rem',
                            bgcolor: 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: 150,
                          }}
                        >
                          {errorInfo.componentStack}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Recovery Suggestions */}
              <Typography variant="h6" gutterBottom>
                Recovery Options
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Try one of these options to recover from the error:
              </Typography>
            </CardContent>

            <CardActions sx={{ p: 3, pt: 0 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ width: '100%' }}>
                {/* Primary Actions */}
                {isRetryable && (
                  <Button
                    variant="contained"
                    onClick={this.handleRetryClick}
                    startIcon={<RefreshIcon />}
                    color="primary"
                  >
                    Retry ({this.maxRetries - retryCount} attempts left)
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  onClick={this.handleGoHome}
                  startIcon={<HomeIcon />}
                >
                  Go to Dashboard
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={this.handleGoToSettings}
                  startIcon={<SettingsIcon />}
                >
                  Open Settings
                </Button>

                {/* Secondary Actions */}
                <Box sx={{ flexGrow: 1 }} />
                
                <Tooltip title="Copy error details to clipboard">
                  <IconButton onClick={this.handleCopyError}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
                
                <Button
                  size="small"
                  onClick={this.handleReset}
                  startIcon={<RefreshIcon />}
                  color="warning"
                >
                  Reset App
                </Button>
              </Stack>
            </CardActions>
          </Card>

          {/* Help Information */}
          <Box sx={{ mt: 3, textAlign: 'center', maxWidth: 500 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              If this error persists, try resetting the application or check the 
              troubleshooting guide in the help documentation.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Error reports are saved locally and can help diagnose issues.
              No personal data is transmitted externally.
            </Typography>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Enhanced error boundary with automatic error reporting
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  customFallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const BoundaryWrapper: React.FC<P> = (props) => (
    <GlobalErrorBoundary fallback={customFallback} onError={onError}>
      <WrappedComponent {...props} />
    </GlobalErrorBoundary>
  );

  BoundaryWrapper.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return BoundaryWrapper;
};

export default GlobalErrorBoundary;
