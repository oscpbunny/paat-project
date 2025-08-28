/**
 * PAAT - AI Personal Assistant Agent Tool
 * React Error Boundary Component
 * 
 * Provides graceful error handling and recovery for production applications
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stack,
  Divider
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  BugReport as BugIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and external service if available
    console.error('PAAT Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you might want to log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Implement error logging to external service (e.g., Sentry, LogRocket)
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // For now, just log to console in a structured way
    console.error('Structured Error Log:', JSON.stringify(errorData, null, 2));
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'background.default',
            p: 3
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3} alignItems="center">
                <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />
                
                <Typography variant="h4" component="h1" textAlign="center">
                  Something went wrong
                </Typography>
                
                <Alert severity="error" sx={{ width: '100%' }}>
                  <Typography variant="body1">
                    An unexpected error occurred in the PAAT application. 
                    We apologize for the inconvenience.
                  </Typography>
                </Alert>

                <Divider sx={{ width: '100%' }} />

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={this.handleRetry}
                    color="primary"
                  >
                    Try Again
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={this.handleGoHome}
                    color="secondary"
                  >
                    Go Home
                  </Button>
                </Stack>

                {process.env.NODE_ENV === 'development' && (
                  <>
                    <Divider sx={{ width: '100%' }} />
                    
                    <Alert severity="info" sx={{ width: '100%' }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Error ID:</strong> {this.state.errorId}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Error:</strong> {this.state.error?.message}
                      </Typography>
                      {this.state.error?.stack && (
                        <details style={{ marginTop: '8px' }}>
                          <summary style={{ cursor: 'pointer' }}>
                            <Typography variant="body2" component="span">
                              Stack Trace
                            </Typography>
                          </summary>
                          <pre style={{ 
                            fontSize: '12px', 
                            overflow: 'auto', 
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '4px'
                          }}>
                            {this.state.error.stack}
                          </pre>
                        </details>
                      )}
                    </Alert>

                    <Button
                      variant="text"
                      startIcon={<BugIcon />}
                      onClick={this.copyErrorDetails}
                      size="small"
                    >
                      Copy Error Details
                    </Button>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
