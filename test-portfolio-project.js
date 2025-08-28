/**
 * Portfolio Project Creation Test - PAAT + Vamsh Integration
 * 
 * This script demonstrates the complete PAAT-Vamsh workflow by creating
 * a portfolio webapp project that showcases the integration capabilities.
 */

const path = require('path');

// Import PAAT services (we'll run this through PAAT's environment)
const { vamshIntegrationService } = require('./dist/main/services/VamshIntegrationService');
const { vamshService } = require('./dist/main/services/VamshService');

async function testPortfolioProject() {
  console.log('🚀 Starting PAAT-Vamsh Portfolio Project Integration Test...\n');

  // Define the portfolio project specification
  const portfolioProject = {
    name: 'Modern Portfolio Website',
    description: 'A responsive, modern portfolio website showcasing web development skills with interactive features and professional design.',
    requirements: `Create a modern, responsive portfolio website with the following features:

DESIGN & LAYOUT:
- Clean, professional design with dark/light theme toggle
- Responsive layout that works on desktop, tablet, and mobile
- Smooth animations and transitions
- Modern typography and color scheme
- Professional hero section with introduction

SECTIONS:
1. Hero/About section with professional photo placeholder and introduction
2. Skills section with technology icons and proficiency levels
3. Projects showcase with image galleries and project details
4. Experience/Resume timeline
5. Contact form with validation
6. Footer with social media links

TECHNICAL FEATURES:
- Built with React.js and modern JavaScript (ES6+)
- CSS-in-JS or styled-components for styling
- Responsive CSS Grid and Flexbox layouts
- Form validation for contact form
- Smooth scrolling navigation
- Performance optimized (lazy loading, code splitting)
- SEO friendly with proper meta tags
- Accessibility (WCAG) compliant

INTERACTIVE ELEMENTS:
- Animated skill bars or progress indicators
- Project filtering by technology/category  
- Image lightbox/modal for project galleries
- Typing animation for the hero text
- Parallax scrolling effects (subtle)
- Hover effects and micro-interactions

CONTENT STRUCTURE:
- Professional placeholder content for demonstration
- Sample projects with descriptions and tech stacks
- Placeholder contact information
- Professional bio/about text
- Skills categorized by frontend, backend, tools

DEPLOYMENT:
- Production-ready build configuration
- Environment-specific settings
- README with setup and deployment instructions`,
    priority: 'high',
    tags: ['portfolio', 'react', 'web-development', 'responsive', 'demo'],
    estimatedDuration: 8 // hours
  };

  try {
    // Step 1: Test Vamsh connectivity
    console.log('📡 Testing Vamsh connectivity...');
    const vamshStatus = await vamshService.testConnection();
    console.log('Vamsh Status:', vamshStatus.connected ? '✅ Connected' : '❌ Disconnected');
    
    if (!vamshStatus.connected) {
      console.log('⚠️  Vamsh is not available. Error:', vamshStatus.error);
      console.log('📝 Project will be created in PAAT but handoff to Vamsh will be skipped.\n');
    }

    // Step 2: Create project with integration
    console.log('🎯 Creating portfolio project through PAAT integration...\n');
    
    const integrationResult = await vamshIntegrationService.createProjectWithVamshIntegration(
      portfolioProject,
      (status) => {
        console.log(`📊 [${status.phase.toUpperCase()}] ${status.progress}% - ${status.message}`);
      }
    );

    // Step 3: Display results
    console.log('\n🎉 Integration Test Results:');
    console.log('===============================');
    console.log(`✅ Success: ${integrationResult.success}`);
    console.log(`📋 Project ID: ${integrationResult.projectId}`);
    console.log(`🤖 Vamsh Project ID: ${integrationResult.vamshProjectId}`);
    
    if (integrationResult.specification) {
      console.log(`📝 Specification: Generated (${integrationResult.specification.features.core.length} core features)`);
    }
    
    if (integrationResult.taskBreakdown) {
      console.log(`📋 Task Breakdown: ${integrationResult.taskBreakdown.phases.length} phases, ${integrationResult.taskBreakdown.totalEstimatedHours}h estimated`);
    }
    
    if (integrationResult.warnings && integrationResult.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      integrationResult.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (integrationResult.error) {
      console.log(`❌ Error: ${integrationResult.error}`);
    }

    // Step 4: If successful, start monitoring
    if (integrationResult.success && vamshStatus.connected) {
      console.log('\n🔍 Starting project monitoring...');
      
      // Monitor for a short period to see Vamsh activity
      let monitoringCount = 0;
      const maxMonitoring = 10; // Monitor for ~30 seconds
      
      const monitorInterval = setInterval(async () => {
        try {
          const projectStatus = await vamshService.getProjectStatus(portfolioProject.name);
          console.log(`📊 Monitoring (${monitoringCount + 1}/${maxMonitoring}): Agent Active: ${projectStatus.active}, Messages: ${projectStatus.recentMessages.length}`);
          
          if (projectStatus.recentMessages.length > 0) {
            const lastMessage = projectStatus.recentMessages[projectStatus.recentMessages.length - 1];
            console.log(`   💬 Latest: ${lastMessage.message.substring(0, 100)}...`);
          }
          
          monitoringCount++;
          if (monitoringCount >= maxMonitoring) {
            clearInterval(monitorInterval);
            console.log('\n✅ Integration test completed successfully!');
            console.log(`📁 Check the PAAT database and Vamsh interface for project details.`);
            process.exit(0);
          }
        } catch (error) {
          console.log(`⚠️  Monitoring error: ${error.message}`);
        }
      }, 3000);
    } else {
      console.log('\n✅ Project created successfully in PAAT!');
      console.log('🔗 Open PAAT interface to view project details and manage development.');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testPortfolioProject();
