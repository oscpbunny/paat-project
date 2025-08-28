/**
 * Direct Portfolio Project Submission to Vamsh
 * 
 * This script sends the portfolio project directly to Vamsh using the correct API
 * format and then monitors for immediate responses or activity.
 */

const { vamshService } = require('./dist/main/services/VamshService');

async function sendPortfolioDirectly() {
  console.log('🚀 Sending Portfolio Project Directly to Vamsh...\n');

  const portfolioMessage = `I need you to create a modern portfolio website with the following specifications:

PROJECT: Modern Portfolio Website

TECHNICAL STACK:
- React.js with modern JavaScript (ES6+)
- Responsive CSS Grid and Flexbox
- CSS-in-JS or styled-components
- Component-based architecture

FEATURES REQUIRED:
1. Hero Section:
   - Professional introduction
   - Animated typing effect for job title
   - Call-to-action buttons
   
2. About Section:
   - Professional bio
   - Skills showcase with progress bars
   - Technology icons and proficiency levels

3. Projects Section:
   - Project cards with images and descriptions
   - Filter by technology/category
   - Links to live demos and GitHub

4. Experience Section:
   - Timeline layout for work experience
   - Education and certifications
   - Downloadable resume

5. Contact Section:
   - Contact form with validation
   - Social media links
   - Professional contact information

DESIGN REQUIREMENTS:
- Clean, professional design
- Dark/light theme toggle
- Responsive (desktop, tablet, mobile)
- Smooth animations and transitions
- Modern typography and color scheme

IMPLEMENTATION DETAILS:
- Use placeholder content for demonstration
- Form validation with error handling
- SEO optimized with meta tags
- Accessibility (WCAG) compliant
- Production-ready build setup

Please start development immediately. Create the complete React application with all components, styling, and functionality as specified.`;

  try {
    console.log('📡 Testing Vamsh connection...');
    const connection = await vamshService.testConnection();
    
    if (!connection.connected) {
      console.log(`❌ Vamsh is not available: ${connection.error}`);
      return;
    }
    
    console.log('✅ Vamsh is connected and healthy!');
    console.log(`   Status: ${connection.health.status}`);
    console.log(`   Uptime: ${connection.health.uptime}\n`);

    console.log('📝 Sending detailed portfolio project message...');
    
    // Send the message using the API
    await vamshService.sendMessage({
      project_name: 'Modern Portfolio Website',
      message: portfolioMessage,
      user_id: 'paat-integration-test'
    });
    
    console.log('✅ Portfolio project message sent successfully!\n');

    // Wait a moment and then check for any immediate activity
    console.log('⏳ Waiting 5 seconds for potential AI response...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check messages immediately after sending
    console.log('📬 Checking for messages...');
    const messages = await vamshService.getMessages('Modern Portfolio Website');
    console.log(`Found ${messages.length} messages`);
    
    if (messages.length > 0) {
      messages.forEach((msg, index) => {
        console.log(`\n📨 Message ${index + 1}:`);
        console.log(`   From: ${msg.from}`);
        console.log(`   Time: ${msg.timestamp}`);
        console.log(`   Content: ${msg.message.substring(0, 300)}${msg.message.length > 300 ? '...' : ''}`);
      });
    }

    // Check if agent becomes active
    console.log('\n🔍 Checking agent activity...');
    const isActive = await vamshService.isAgentActive('Modern Portfolio Website');
    console.log(`Agent Status: ${isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}`);

    if (isActive) {
      console.log('🎉 GREAT! The AI agent is now active and working on the portfolio!');
      
      // Get detailed state
      try {
        const state = await vamshService.getAgentState('Modern Portfolio Website');
        console.log(`Current Step: ${state.current_step}`);
        console.log(`Progress: ${state.completion_percentage}%`);
      } catch (error) {
        console.log('Could not get detailed agent state');
      }
    } else {
      console.log('ℹ️  Agent is not active yet. This is normal for Vamsh.');
      console.log('The AI agent needs to be started manually in the Vamsh UI.');
    }

    // Try to get recent logs to see if there's any backend activity
    console.log('\n📋 Checking for recent activity in logs...');
    try {
      const logs = await vamshService.getLogs();
      if (logs && logs.length > 0) {
        console.log(`System has ${logs.length} total log entries`);
        console.log('Recent activity detected in the system');
      }
    } catch (error) {
      console.log('Could not access system logs');
    }

    console.log('\n🎯 Current Status Summary:');
    console.log('==========================');
    console.log('✅ PAAT successfully sent portfolio project to Vamsh');
    console.log('✅ Vamsh backend is running and responsive');
    console.log('✅ Message delivery system is functional');
    console.log('⚠️  AI agent requires manual activation via Vamsh UI');
    
    console.log('\n🔗 Next Steps:');
    console.log('1. The project is now queued in Vamsh');
    console.log('2. Start Vamsh UI to activate the AI agent');
    console.log('3. Select the project and choose an AI model'); 
    console.log('4. Click "Start Agent" to begin development');
    console.log('5. Monitor progress through both PAAT and Vamsh UI');

    console.log('\n💻 Access Points:');
    console.log('   Vamsh Backend API: http://localhost:1337');
    console.log('   Vamsh API Docs: http://localhost:1337/docs');
    console.log('   PAAT Dashboard: http://localhost:3000 (when running)');

  } catch (error) {
    console.error('❌ Error sending portfolio project:', error.message);
    console.error('Full error details:', error);
  }
}

// Run the direct submission
sendPortfolioDirectly();
