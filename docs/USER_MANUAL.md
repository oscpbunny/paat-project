# PAAT User Manual
**AI Personal Assistant Agent Tool - Version 3.0.0**

## Table of Contents
1. [Getting Started](#getting-started)
2. [Installation Guide](#installation-guide)
3. [First Launch Setup](#first-launch-setup)
4. [Core Features](#core-features)
5. [Project Management](#project-management)
6. [AI Integration](#ai-integration)
7. [Settings and Preferences](#settings-and-preferences)
8. [Troubleshooting](#troubleshooting)
9. [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

Welcome to PAAT (AI Personal Assistant Agent Tool)! PAAT is a powerful desktop application that combines advanced project management with AI-powered development capabilities.

### What is PAAT?

PAAT is a local-first project management tool designed specifically for software developers. It integrates with AI services like Ollama and Vamsh to provide intelligent project analysis, task breakdown, and automated development assistance.

### Key Benefits

- **🚀 Intelligent Project Management**: Automatic task breakdown and priority assignment
- **🤖 AI-Powered Analysis**: Local Ollama integration for privacy-first AI assistance
- **🔒 Complete Privacy**: All data stays on your local machine
- **⚡ Real-time Monitoring**: Track project progress with live updates
- **🎯 Professional Interface**: Built with Material-UI for a polished experience

## Installation Guide

### System Requirements

**Minimum Requirements:**
- Windows 10 (64-bit) / macOS 10.15+ / Ubuntu 18.04+
- 8 GB RAM
- 2 GB free disk space
- Internet connection (for initial setup and AI model downloads)

**Recommended Requirements:**
- Windows 11 / macOS 12+ / Ubuntu 20.04+
- 16 GB RAM
- 10 GB free disk space (for AI models)
- SSD storage for better performance

### Installation Steps

#### Windows Installation

1. **Download PAAT**
   - Download the latest `PAAT-Setup-3.0.0.exe` from the releases page
   - Verify the file integrity using the provided SHA256 checksum

2. **Run Installer**
   - Right-click the installer and select "Run as administrator"
   - Follow the installation wizard prompts
   - Choose installation directory (default: `C:\Program Files\PAAT`)

3. **First Launch**
   - Launch PAAT from the desktop shortcut or Start menu
   - The application will perform initial setup automatically

#### macOS Installation

1. **Download PAAT**
   - Download `PAAT-3.0.0.dmg` from the releases page
   - Open the DMG file

2. **Install Application**
   - Drag PAAT.app to your Applications folder
   - Launch PAAT from Applications or Launchpad

3. **Security Setup**
   - If macOS blocks the app, go to System Preferences > Security & Privacy
   - Click "Open Anyway" to allow PAAT to run

#### Linux Installation

1. **Download Package**
   - Download `paat_3.0.0_amd64.deb` (Ubuntu/Debian) or `paat-3.0.0.x86_64.rpm` (Red Hat/SUSE)

2. **Install via Package Manager**
   ```bash
   # Ubuntu/Debian
   sudo dpkg -i paat_3.0.0_amd64.deb
   sudo apt-get install -f  # Fix dependencies if needed
   
   # Red Hat/CentOS/Fedora
   sudo rpm -i paat-3.0.0.x86_64.rpm
   ```

3. **Launch Application**
   - Find PAAT in your applications menu or run `paat` from terminal

## First Launch Setup

When you first launch PAAT, you'll be guided through a setup wizard:

### Step 1: Welcome and License
- Read and accept the software license agreement
- Review privacy policy and data handling practices

### Step 2: AI Services Configuration
- **Ollama Setup**: PAAT will detect if Ollama is installed
  - If not installed, follow the provided installation guide
  - Download recommended models: Qwen2.5:7b, Gemma2:2b
- **Vamsh Integration** (Optional): Configure Vamsh AI if available
  - Enter Vamsh installation path (e.g., `E:\vamsh`)
  - Test connection and verify API access

### Step 3: Project Directory Setup
- Choose your default projects directory
- PAAT will scan for existing projects
- Set up file monitoring preferences

### Step 4: Preferences
- Choose your preferred theme (Light/Dark/System)
- Configure notification preferences
- Set up backup and auto-save options

## Core Features

### Dashboard Overview

The main dashboard provides a comprehensive view of your projects:

- **Project Cards**: Quick overview of all active projects
- **Recent Activity**: Latest changes and updates
- **AI Status**: Current status of connected AI services
- **Quick Actions**: Create new projects, import existing ones

### Project Creation

#### New Project Wizard

1. **Click "New Project"** from the dashboard
2. **Choose Project Type**:
   - Web Application (React, Vue, Angular)
   - Mobile App (React Native, Flutter)
   - API/Backend (Node.js, Python, Java)
   - Desktop Application (Electron, .NET)
   - Custom/Other

3. **Project Configuration**:
   - Enter project name and description
   - Choose technologies and frameworks
   - Set project goals and requirements

4. **AI Analysis** (Optional):
   - Let PAAT's AI analyze your requirements
   - Generate automatic task breakdown
   - Create initial project structure

### Task Management

#### Kanban Board Interface

PAAT uses a professional Kanban board for task management:

- **Backlog**: Planned tasks and features
- **In Progress**: Currently active tasks
- **Review**: Tasks awaiting review or testing
- **Done**: Completed tasks

#### Task Operations

- **Create Tasks**: Click "+" in any column
- **Move Tasks**: Drag and drop between columns
- **Edit Tasks**: Click on any task card to open details
- **Add Subtasks**: Break down complex tasks into smaller steps
- **Set Due Dates**: Schedule task completion
- **Assign Priority**: High, Medium, Low priority levels

### File Monitoring

PAAT automatically monitors your project directories:

- **Real-time Updates**: See file changes as they happen
- **Change History**: View timeline of all modifications
- **Diff Viewer**: Compare file versions side-by-side
- **Backup System**: Automatic backups before major changes

## AI Integration

### Ollama Integration

#### Supported Models

PAAT works with several Ollama models optimized for different tasks:

- **Qwen2.5:7b (4.7GB)**: Best for complex reasoning and project analysis
- **Llama3.1:8b (4.9GB)**: Alternative for planning and architecture tasks
- **Gemma2:2b (1.6GB)**: Lightweight option for text processing
- **Gemma3:1b (815MB)**: Ultra-fast responses for UI interactions

#### Using AI Features

1. **Project Analysis**:
   - Right-click any project → "Analyze with AI"
   - AI will review project structure and suggest improvements
   - Get recommendations for architecture, dependencies, and best practices

2. **Task Breakdown**:
   - Create a high-level task description
   - Click "AI Breakdown" to automatically generate subtasks
   - AI considers project context and complexity

3. **Code Review**:
   - Select code files for AI review
   - Get suggestions for improvements, bugs, and optimizations
   - Receive security and performance recommendations

### Vamsh AI Integration

If you have Vamsh AI installed, PAAT can integrate for advanced capabilities:

#### Autonomous Development

1. **Create Development Task**:
   - Describe what you want to build in natural language
   - Example: "Create a REST API for user authentication with JWT"

2. **AI Planning Phase**:
   - Vamsh AI analyzes requirements
   - Creates detailed development plan
   - Breaks down into actionable steps

3. **Autonomous Execution**:
   - Watch as AI writes code, creates files, and structures the project
   - Real-time monitoring of AI progress
   - Automatic Git commits for each major change

4. **Review and Finalize**:
   - Review AI-generated code
   - Test functionality and make adjustments
   - Accept changes or request modifications

## Project Management

### Project Templates

PAAT includes pre-configured templates for common project types:

#### Web Application Template
- React/TypeScript setup
- Material-UI components
- ESLint and Prettier configuration
- Testing framework setup
- Build and deployment scripts

#### API Backend Template
- Node.js/Express or Python/FastAPI
- Database setup (SQLite, PostgreSQL)
- Authentication middleware
- API documentation setup
- Testing and validation

#### Mobile App Template
- React Native or Flutter setup
- Navigation structure
- State management configuration
- Device-specific optimizations
- App store deployment guide

### Project Analytics

Track your project's progress with detailed analytics:

- **Velocity Tracking**: Monitor development speed over time
- **Task Completion Rates**: Identify bottlenecks and blockers
- **Code Metrics**: Lines of code, complexity, and quality scores
- **Time Tracking**: Detailed time logging for accurate estimates

### Collaboration Features

While PAAT is local-first, it supports collaboration:

- **Export Reports**: Share project status with team members
- **Git Integration**: Seamless version control workflows
- **Documentation Export**: Generate project documentation
- **Backup Sharing**: Share project backups securely

## Settings and Preferences

### General Settings

Access settings via the gear icon in the top-right corner:

#### Appearance
- **Theme**: Light, Dark, or System preference
- **Font Size**: Adjust interface text size
- **Zoom Level**: Scale entire interface
- **Language**: Choose interface language

#### Behavior
- **Auto-save**: Configure automatic saving intervals
- **Notifications**: Enable/disable various notification types
- **Startup**: Choose what happens when PAAT starts
- **File Associations**: Associate project file types with PAAT

### AI Service Settings

#### Ollama Configuration
- **Server URL**: Usually `http://localhost:11434`
- **Model Selection**: Choose primary and fallback models
- **Performance**: Adjust model parameters for speed vs quality
- **Cache Settings**: Configure response caching

#### Vamsh Settings
- **Installation Path**: Path to Vamsh AI installation
- **API Endpoint**: Connection details for Vamsh API
- **Authentication**: API keys and access tokens
- **Feature Toggles**: Enable/disable specific Vamsh features

### Project Settings

Each project has individual settings:

- **File Monitoring**: Which directories to watch
- **Git Integration**: Repository settings and branch preferences
- **Build Configuration**: Custom build commands and scripts
- **AI Preferences**: Model selection for this specific project

### Advanced Settings

For power users:

- **Database**: SQLite database optimization settings
- **Performance**: Memory usage and CPU priority settings
- **Logging**: Debug logging and log file management
- **Security**: Encryption and privacy settings

## Troubleshooting

### Common Issues and Solutions

#### PAAT Won't Start

**Problem**: Application fails to launch or crashes on startup

**Solutions**:
1. Check system requirements are met
2. Run as administrator (Windows) or with proper permissions
3. Check for conflicting software (antivirus, firewalls)
4. Clear application data: `%APPDATA%/PAAT` (Windows) or `~/Library/Application Support/PAAT` (macOS)

#### AI Services Not Working

**Problem**: Ollama or Vamsh AI integration fails

**Solutions**:
1. Verify Ollama is running: `ollama list` in terminal
2. Check Ollama service status: `systemctl status ollama` (Linux)
3. Restart Ollama service: `ollama serve`
4. For Vamsh, verify installation path in settings
5. Check firewall settings allow local connections

#### Project Not Loading

**Problem**: Projects don't appear or fail to load

**Solutions**:
1. Check project directory permissions
2. Verify project contains PAAT configuration files
3. Try reimporting the project: File → Import Project
4. Check disk space and file system health
5. Review error logs in Help → Show Logs

#### Performance Issues

**Problem**: PAAT runs slowly or consumes too much memory

**Solutions**:
1. Adjust AI model settings to use lighter models
2. Limit file monitoring to essential directories only
3. Reduce auto-save frequency in settings
4. Close unused project tabs
5. Restart PAAT periodically for optimal performance

### Error Messages

#### "AI Service Unavailable"
- Check if Ollama is running
- Verify network connections to AI services
- Restart AI services if needed

#### "Project Database Locked"
- Close other instances of PAAT
- Check file permissions on project directory
- Restart PAAT to release database locks

#### "File Monitoring Failed"
- Check directory permissions
- Verify disk space availability
- Reduce number of monitored directories

### Getting Help

If you need additional support:

1. **Check Documentation**: Review this manual and online docs
2. **Community Forum**: Join our community discussions
3. **Bug Reports**: Report issues via GitHub issues
4. **Contact Support**: Email support for enterprise users

## Tips and Best Practices

### Optimizing AI Performance

1. **Choose Appropriate Models**:
   - Use Gemma3:1b for quick responses
   - Use Qwen2.5:7b for complex analysis
   - Switch models based on task complexity

2. **Manage System Resources**:
   - Close unnecessary applications when using AI
   - Ensure sufficient RAM for large models
   - Use SSD storage for better model loading times

3. **Effective Prompting**:
   - Be specific and detailed in AI requests
   - Provide context about your project type and goals
   - Break complex requests into smaller parts

### Project Organization

1. **Consistent Structure**:
   - Use standard project layouts for each technology
   - Maintain consistent naming conventions
   - Document project decisions and architecture

2. **Regular Maintenance**:
   - Archive completed projects to reduce clutter
   - Update project descriptions as goals evolve
   - Clean up unused files and dependencies

3. **Backup Strategy**:
   - Enable automatic backups in settings
   - Regularly export project data
   - Use version control (Git) for all projects

### Workflow Optimization

1. **Task Management**:
   - Break large tasks into smaller, manageable pieces
   - Use priority levels to focus on important work
   - Set realistic due dates and milestones

2. **AI Integration**:
   - Start with AI analysis for new projects
   - Use AI for routine code reviews
   - Let AI handle boilerplate code generation

3. **Collaboration**:
   - Export regular progress reports
   - Share project templates with team members
   - Use standard Git workflows for version control

### Security Best Practices

1. **Data Privacy**:
   - Keep sensitive data in environment variables
   - Avoid committing secrets to version control
   - Regularly update dependencies for security patches

2. **Access Control**:
   - Use proper file permissions on project directories
   - Secure AI service endpoints if accessible remotely
   - Enable encryption for sensitive projects

---

## Keyboard Shortcuts

### Global Shortcuts
- `Ctrl/Cmd + N`: New Project
- `Ctrl/Cmd + O`: Open Project
- `Ctrl/Cmd + S`: Save Current Work
- `Ctrl/Cmd + ,`: Open Settings
- `F5`: Refresh Current View
- `Ctrl/Cmd + Q`: Quit Application

### Navigation
- `Ctrl/Cmd + Tab`: Switch Between Project Tabs
- `Ctrl/Cmd + W`: Close Current Tab
- `Ctrl/Cmd + 1-9`: Jump to Specific Project Tab
- `Escape`: Close Current Dialog/Modal

### Task Management
- `Ctrl/Cmd + T`: Create New Task
- `Space`: Mark Task Complete
- `Delete`: Delete Selected Task
- `Enter`: Edit Task Details
- `Ctrl/Cmd + D`: Duplicate Task

### AI Features
- `Ctrl/Cmd + K`: Open AI Command Palette
- `Ctrl/Cmd + Shift + A`: Analyze Current Project
- `Ctrl/Cmd + Shift + R`: Start AI Code Review
- `Ctrl/Cmd + Shift + B`: AI Task Breakdown

---

*This manual covers the core functionality of PAAT. For advanced features, API documentation, and development guides, please refer to the Developer Documentation.*

**Version**: 3.0.0  
**Last Updated**: August 2025  
**Support**: support@paat.dev
