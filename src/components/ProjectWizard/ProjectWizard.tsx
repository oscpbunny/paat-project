import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowBack,
  ArrowForward,
  AutoAwesome,
  Psychology,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

import ProjectBasicsStep from './steps/ProjectBasicsStep';
import ProjectAnalysisStep from './steps/ProjectAnalysisStep';
import TaskBreakdownStep from './steps/TaskBreakdownStep';
import ReviewStep from './steps/ReviewStep';
import { ollamaService } from '../../services/ollama';
import { vamshService } from '../../services/VamshService';

export interface ProjectWizardData {
  // Basic Information
  name: string;
  description: string;
  type: 'web-app' | 'mobile-app' | 'api' | 'desktop-app' | 'library' | 'other';
  priority: 'low' | 'medium' | 'high';
  
  // Technical Details
  technologies: string[];
  requirements: string[];
  constraints: string[];
  
  // AI Analysis
  aiAnalysis?: {
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedDuration: number;
    recommendedApproach: string;
    risks: string[];
    suggestions: string[];
  };
  
  // Generated Tasks
  tasks?: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    estimatedHours: number;
    dependencies: string[];
    phase: string;
  }>;
}

interface ProjectWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: ProjectWizardData) => void;
}

const steps = [
  {
    label: 'Project Basics',
    description: 'Basic project information and requirements',
  },
  {
    label: 'AI Analysis',
    description: 'Let AI analyze your project requirements',
  },
  {
    label: 'Task Breakdown',
    description: 'Review and customize generated tasks',
  },
  {
    label: 'Review & Create',
    description: 'Final review before project creation',
  },
];

const ProjectWizard: React.FC<ProjectWizardProps> = ({
  open,
  onClose,
  onComplete,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [wizardData, setWizardData] = useState<ProjectWizardData>({
    name: '',
    description: '',
    type: 'web-app',
    priority: 'medium',
    technologies: [],
    requirements: [],
    constraints: [],
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset wizard when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setWizardData({
        name: '',
        description: '',
        type: 'web-app',
        priority: 'medium',
        technologies: [],
        requirements: [],
        constraints: [],
      });
      setError(null);
    }
  }, [open]);

  const handleNext = async () => {
    try {
      setError(null);

      // Special handling for AI analysis step
      if (activeStep === 1) {
        await runAIAnalysis();
      }
      
      // Special handling for task breakdown step
      if (activeStep === 2) {
        await generateTasks();
      }

      setActiveStep((prevStep) => prevStep + 1);
    } catch (error) {
      console.error('Error in wizard step:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setWizardData({
      name: '',
      description: '',
      type: 'web-app',
      priority: 'medium',
      technologies: [],
      requirements: [],
      constraints: [],
    });
    setError(null);
  };

  const handleComplete = () => {
    onComplete(wizardData);
    onClose();
  };

  const runAIAnalysis = async () => {
    setIsProcessing(true);
    setProcessingMessage('Analyzing project requirements...');

    try {
      const analysisPrompt = `
Analyze the following project requirements and provide insights:

Project: ${wizardData.name}
Description: ${wizardData.description}
Type: ${wizardData.type}
Priority: ${wizardData.priority}
Technologies: ${wizardData.technologies.join(', ')}
Requirements: ${wizardData.requirements.join(', ')}
Constraints: ${wizardData.constraints.join(', ')}

Please provide:
1. Project complexity (simple/moderate/complex)
2. Estimated duration in hours
3. Recommended development approach
4. Potential risks and challenges
5. Implementation suggestions

Format your response as JSON with the following structure:
{
  "complexity": "simple|moderate|complex",
  "estimatedDuration": number,
  "recommendedApproach": "string",
  "risks": ["risk1", "risk2"],
  "suggestions": ["suggestion1", "suggestion2"]
}
`;

      const response = await ollamaService.generateResponse(
        'qwen2.5:7b',
        analysisPrompt,
        {
          temperature: 0.3,
          max_tokens: 1000,
        }
      );

      try {
        // Try to parse JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const aiAnalysis = JSON.parse(jsonMatch[0]);
          
          setWizardData(prev => ({
            ...prev,
            aiAnalysis
          }));
        } else {
          // Fallback if JSON parsing fails
          const aiAnalysis = {
            complexity: 'moderate' as const,
            estimatedDuration: Math.max(20, wizardData.requirements.length * 8),
            recommendedApproach: 'Iterative development with regular testing and feedback',
            risks: ['Technical complexity', 'Timeline constraints'],
            suggestions: ['Start with MVP', 'Use proven technologies', 'Plan for testing']
          };
          
          setWizardData(prev => ({
            ...prev,
            aiAnalysis
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Provide fallback analysis
        const aiAnalysis = {
          complexity: 'moderate' as const,
          estimatedDuration: Math.max(20, wizardData.requirements.length * 8),
          recommendedApproach: 'Structured development with clear milestones',
          risks: ['Scope creep', 'Technical challenges'],
          suggestions: ['Break down into phases', 'Regular progress reviews']
        };
        
        setWizardData(prev => ({
          ...prev,
          aiAnalysis
        }));
      }

    } catch (error) {
      console.error('AI analysis failed:', error);
      // Provide fallback analysis on error
      const aiAnalysis = {
        complexity: 'moderate' as const,
        estimatedDuration: 40,
        recommendedApproach: 'Standard development approach with regular milestones',
        risks: ['Timeline management', 'Resource allocation'],
        suggestions: ['Plan iteratively', 'Focus on core features first']
      };
      
      setWizardData(prev => ({
        ...prev,
        aiAnalysis
      }));
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const generateTasks = async () => {
    setIsProcessing(true);
    setProcessingMessage('Generating project tasks...');

    try {
      const taskPrompt = `
Based on the following project details, create a comprehensive task breakdown:

Project: ${wizardData.name}
Description: ${wizardData.description}
Type: ${wizardData.type}
Technologies: ${wizardData.technologies.join(', ')}
Requirements: ${wizardData.requirements.join(', ')}
Estimated Duration: ${wizardData.aiAnalysis?.estimatedDuration || 40} hours

Generate 8-12 specific tasks that cover all aspects of development. For each task, provide:
- Title (brief and clear)
- Description (what needs to be done)
- Priority (low/medium/high)
- Estimated hours (realistic estimate)
- Dependencies (which other tasks must complete first)
- Development phase (planning/development/testing/deployment)

Format as JSON array:
[{
  "title": "Task title",
  "description": "Detailed description",
  "priority": "medium",
  "estimatedHours": 8,
  "dependencies": [],
  "phase": "development"
}]
`;

      const response = await ollamaService.generateResponse(
        'qwen2.5:7b',
        taskPrompt,
        {
          temperature: 0.4,
          max_tokens: 1500,
        }
      );

      try {
        // Try to parse JSON from the response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const taskList = JSON.parse(jsonMatch[0]);
          
          const tasks = taskList.map((task: any, index: number) => ({
            id: `task_${index + 1}`,
            title: task.title || `Task ${index + 1}`,
            description: task.description || 'Task description',
            priority: task.priority || 'medium',
            estimatedHours: task.estimatedHours || 4,
            dependencies: task.dependencies || [],
            phase: task.phase || 'development'
          }));
          
          setWizardData(prev => ({
            ...prev,
            tasks
          }));
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse task response:', parseError);
        // Generate fallback tasks
        const fallbackTasks = generateFallbackTasks();
        setWizardData(prev => ({
          ...prev,
          tasks: fallbackTasks
        }));
      }

    } catch (error) {
      console.error('Task generation failed:', error);
      // Generate fallback tasks
      const fallbackTasks = generateFallbackTasks();
      setWizardData(prev => ({
        ...prev,
        tasks: fallbackTasks
      }));
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const generateFallbackTasks = () => {
    const baseHours = Math.floor((wizardData.aiAnalysis?.estimatedDuration || 40) / 8);
    
    return [
      {
        id: 'task_1',
        title: 'Project Setup & Planning',
        description: 'Initialize project structure and development environment',
        priority: 'high' as const,
        estimatedHours: baseHours,
        dependencies: [],
        phase: 'planning'
      },
      {
        id: 'task_2',
        title: 'Core Architecture',
        description: 'Design and implement the core system architecture',
        priority: 'high' as const,
        estimatedHours: baseHours * 2,
        dependencies: ['task_1'],
        phase: 'development'
      },
      {
        id: 'task_3',
        title: 'Feature Implementation',
        description: 'Implement core features and functionality',
        priority: 'high' as const,
        estimatedHours: baseHours * 3,
        dependencies: ['task_2'],
        phase: 'development'
      },
      {
        id: 'task_4',
        title: 'Testing & QA',
        description: 'Comprehensive testing and quality assurance',
        priority: 'medium' as const,
        estimatedHours: baseHours,
        dependencies: ['task_3'],
        phase: 'testing'
      },
      {
        id: 'task_5',
        title: 'Deployment',
        description: 'Deploy and configure for production environment',
        priority: 'medium' as const,
        estimatedHours: Math.max(baseHours / 2, 2),
        dependencies: ['task_4'],
        phase: 'deployment'
      }
    ];
  };

  const updateWizardData = (updates: Partial<ProjectWizardData>) => {
    setWizardData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <ProjectBasicsStep
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 1:
        return (
          <ProjectAnalysisStep
            data={wizardData}
            isProcessing={isProcessing}
            processingMessage={processingMessage}
          />
        );
      case 2:
        return (
          <TaskBreakdownStep
            data={wizardData}
            onUpdate={updateWizardData}
            isProcessing={isProcessing}
            processingMessage={processingMessage}
          />
        );
      case 3:
        return (
          <ReviewStep
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      default:
        return null;
    }
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 0:
        return !!(wizardData.name && wizardData.description && wizardData.requirements.length > 0);
      case 1:
        return !!wizardData.aiAnalysis;
      case 2:
        return !!(wizardData.tasks && wizardData.tasks.length > 0);
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesome color="primary" />
          <Typography variant="h5" component="span">
            AI-Powered Project Creation Wizard
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ width: '100%' }}>
          {/* Progress Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((step, index) => (
              <Step key={step.label} completed={isStepComplete(index)}>
                <StepLabel>
                  <Typography variant="subtitle2">{step.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Step Content */}
          <Paper elevation={0} sx={{ p: 3, minHeight: 400 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {getStepContent(activeStep)}
              </motion.div>
            </AnimatePresence>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Box>
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                startIcon={<ArrowBack />}
                disabled={isProcessing}
              >
                Back
              </Button>
            )}
          </Box>
          
          <Box display="flex" gap={1}>
            <Button
              onClick={onClose}
              startIcon={<Cancel />}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                onClick={handleComplete}
                variant="contained"
                startIcon={<CheckCircle />}
                disabled={!isStepComplete(activeStep) || isProcessing}
              >
                Create Project
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                endIcon={<ArrowForward />}
                disabled={!isStepComplete(activeStep) || isProcessing}
              >
                {activeStep === 1 ? 'Analyze with AI' : 
                 activeStep === 2 ? 'Generate Tasks' : 'Next'}
              </Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectWizard;
