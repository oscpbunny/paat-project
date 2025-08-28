/**
 * Direct Vamsh Integration Test - Portfolio Project
 * 
 * This bypasses PAAT's AI services and directly sends a project specification
 * to Vamsh for development, demonstrating the core integration workflow.
 */

const { vamshService } = require('./dist/main/services/VamshService');

async function testDirectVamshIntegration() {
  console.log('🚀 Starting Direct PAAT-Vamsh Integration Test...\n');

  const portfolioProjectMessage = `Create a modern portfolio website with the following specifications:

PROJECT NAME: Modern Portfolio Website

DESCRIPTION: A responsive, professional portfolio website showcasing web development skills with modern design and interactive features.

TECHNICAL REQUIREMENTS:
- Framework: React.js with modern JavaScript (ES6+)
- Styling: CSS-in-JS or styled-components
- Layout: Responsive CSS Grid and Flexbox
- Build: Create React App or Vite setup
- Dependencies: Keep minimal and modern

DESIGN FEATURES:
- Clean, professional design with dark/light theme toggle
- Responsive layout (desktop, tablet, mobile)
- Smooth animations and transitions
- Modern typography and professional color scheme

SECTIONS TO INCLUDE:
1. Hero Section:
   - Professional introduction with photo placeholder
   - Animated typing effect for job title
   - Call-to-action buttons

2. About Section:
   - Professional bio and background
   - Skills showcase with progress bars
   - Technology icons and proficiency levels

3. Projects Section:
   - Project cards with images, descriptions, tech stack
   - Filter by technology/category
   - Links to live demos and GitHub repos

4. Experience Section:
   - Timeline layout for work experience
   - Education and certifications
   - Downloadable resume link

5. Contact Section:
   - Contact form with validation
   - Social media links
   - Contact information

6. Footer:
   - Copyright and additional links
   - Back to top button

INTERACTIVE FEATURES:
- Smooth scrolling navigation
- Image lightbox for project galleries
- Form validation with error messages
- Hover effects and micro-interactions
- Loading animations

CONTENT PLACEHOLDERS:
- Use realistic placeholder content for demonstration
- Sample projects with technology stacks
- Professional-looking placeholder images
- Contact form that logs to console

TECHNICAL IMPLEMENTATION:
- Component-based architecture
- State management (useState/useContext)
- Form handling and validation
- Responsive design with mobile-first approach
- Performance optimization (lazy loading)
- SEO meta tags and accessibility features

DELIVERABLES:
- Complete React application
- Production-ready build configuration
- README with setup instructions
- Clean, documented code structure

Please start development immediately and create a professional portfolio website that demonstrates modern web development best practices.`;

  try {
    console.log('📡 Testing Vamsh connection...');
    const connection = await vamshService.testConnection();
    
    if (!connection.connected) {
      console.log(`❌ Vamsh is not connected: ${connection.error}`);
      return;
    }
    
    console.log('✅ Vamsh is connected and healthy!');
    console.log(`   CPU Usage: ${connection.health.cpu_usage}%`);
    console.log(`   Memory Usage: ${connection.health.memory_usage}%`);
    console.log(`   Status: ${connection.health.status}`);
    console.log(`   Uptime: ${connection.health.uptime}\n`);

    // Start the portfolio project in Vamsh
    console.log('🎯 Starting portfolio project development in Vamsh...');
    
    await vamshService.startProject(
      'Modern Portfolio Website',
      'A responsive, modern portfolio website showcasing web development skills with interactive features and professional design.',
      [
        'React.js application with modern JavaScript',
        'Responsive design with dark/light theme toggle',
        'Interactive sections: Hero, About, Projects, Experience, Contact',
        'Professional styling with animations and transitions',
        'Contact form with validation',
        'Portfolio project showcase with filtering',
        'SEO optimized and accessibility compliant',
        'Production-ready build configuration'
      ]
    );

    console.log('✅ Project sent to Vamsh successfully!\n');

    // Monitor the project for a few iterations
    console.log('🔍 Monitoring Vamsh development progress...\n');
    
    let monitorCount = 0;
    const maxMonitoring = 6; // Monitor for about 18 seconds
    
    const monitorInterval = setInterval(async () => {
      try {
        monitorCount++;
        const status = await vamshService.getProjectStatus('Modern Portfolio Website');
        
        console.log(`📊 Monitor ${monitorCount}/${maxMonitoring}:`);
        console.log(`   🤖 Agent Active: ${status.active ? '✅ YES' : '❌ NO'}`);
        console.log(`   💬 Messages: ${status.recentMessages.length}`);
        
        if (status.state && status.active) {
          console.log(`   🎯 Current Step: ${status.state.current_step}`);
          console.log(`   📈 Progress: ${status.state.completion_percentage}%`);
        }
        
        if (status.recentMessages.length > 0) {
          const latestMessage = status.recentMessages[status.recentMessages.length - 1];
          console.log(`   💭 Latest Message: ${latestMessage.message.substring(0, 150)}...`);
        }
        
        console.log(''); // Empty line for readability
        
        if (monitorCount >= maxMonitoring) {
          clearInterval(monitorInterval);
          
          console.log('🎉 Integration test completed!');
          console.log('===============================');
          console.log('✅ PAAT successfully communicated with Vamsh');
          console.log('✅ Project specification was sent to Vamsh AI');
          console.log('✅ Real-time monitoring is working');
          console.log('\n🔗 Next Steps:');
          console.log('   1. Open Vamsh UI at http://localhost:3001 to see the project');
          console.log('   2. Monitor the AI development progress');
          console.log('   3. Check the generated code files');
          console.log('   4. Test the completed portfolio website');
          
          process.exit(0);
        }
        
      } catch (error) {
        console.log(`⚠️  Monitoring error: ${error.message}`);
        if (monitorCount >= maxMonitoring) {
          clearInterval(monitorInterval);
          process.exit(1);
        }
      }
    }, 3000);

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the test
testDirectVamshIntegration();
