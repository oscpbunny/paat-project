/**
 * Portfolio Project Progress Monitor
 * 
 * This script checks the current status and progress of the 
 * "Modern Portfolio Website" project sent from PAAT to Vamsh.
 */

const { vamshService } = require('./dist/main/services/VamshService');

async function checkPortfolioProgress() {
  console.log('🔍 Checking Portfolio Project Progress...\n');
  console.log('=======================================');

  try {
    // Step 1: Check Vamsh connectivity
    console.log('📡 Testing Vamsh connection...');
    const connection = await vamshService.testConnection();
    
    if (!connection.connected) {
      console.log(`❌ Vamsh is not connected: ${connection.error}`);
      return;
    }
    
    console.log('✅ Vamsh is connected and healthy!');
    console.log(`   Status: ${connection.health.status}`);
    console.log(`   CPU Usage: ${connection.health.cpu_usage}%`);
    console.log(`   Memory Usage: ${connection.health.memory_usage}%`);
    console.log(`   Uptime: ${connection.health.uptime}\n`);

    // Step 2: Check project status
    console.log('📊 Checking "Modern Portfolio Website" project status...');
    const projectStatus = await vamshService.getProjectStatus('Modern Portfolio Website');
    
    console.log(`🤖 Agent Active: ${projectStatus.active ? '✅ YES - AI is working!' : '❌ NO - Waiting for activation'}`);
    console.log(`💬 Total Messages: ${projectStatus.recentMessages.length}`);
    
    if (projectStatus.state && projectStatus.active) {
      console.log(`🎯 Current Step: ${projectStatus.state.current_step}`);
      console.log(`📈 Progress: ${projectStatus.state.completion_percentage}%`);
      if (projectStatus.state.start_time) {
        console.log(`⏰ Started: ${projectStatus.state.start_time}`);
      }
      if (projectStatus.state.end_time) {
        console.log(`🏁 Completed: ${projectStatus.state.end_time}`);
      }
    }

    console.log('\n📝 Recent Messages & Activity:');
    console.log('================================');
    
    if (projectStatus.recentMessages.length === 0) {
      console.log('ℹ️  No messages yet. The project may be waiting for AI model configuration.');
      console.log('💡 To activate development:');
      console.log('   1. Open Vamsh UI at http://localhost:3002');
      console.log('   2. Select "Modern Portfolio Website" project');  
      console.log('   3. Choose an AI model (GPT-4, Claude, etc.)');
      console.log('   4. Click "Start Agent" to begin development');
    } else {
      projectStatus.recentMessages.forEach((message, index) => {
        console.log(`\n💬 Message ${index + 1} (${message.from}):`);
        console.log(`   Time: ${message.timestamp}`);
        console.log(`   Content: ${message.message.substring(0, 200)}${message.message.length > 200 ? '...' : ''}`);
      });
    }

    // Step 3: Check if agent is working on the project
    console.log('\n🔄 Real-time Agent Activity Check:');
    console.log('===================================');
    
    const isAgentActive = await vamshService.isAgentActive('Modern Portfolio Website');
    console.log(`Agent Status: ${isAgentActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}`);
    
    if (isAgentActive) {
      try {
        const agentState = await vamshService.getAgentState('Modern Portfolio Website');
        console.log(`Current Activity: ${agentState.current_step || 'Processing...'}`);
        console.log(`Progress: ${agentState.completion_percentage || 0}%`);
      } catch (error) {
        console.log('⚠️  Could not get detailed agent state');
      }
    }

    // Step 4: Check for any generated files or output
    console.log('\n📁 Checking for Generated Files:');
    console.log('=================================');
    
    try {
      // Try to get browser session data to see if Vamsh has done any work
      const browserSession = await vamshService.getBrowserSession();
      console.log('🌐 Browser Session: Available (Vamsh may have done web research)');
    } catch (error) {
      console.log('🌐 Browser Session: Not available');
    }
    
    try {
      // Try to get terminal session to see if any commands were run
      const terminalSession = await vamshService.getTerminalSession();
      console.log('💻 Terminal Session: Available (Vamsh may have run commands)');
    } catch (error) {
      console.log('💻 Terminal Session: Not available');
    }

    // Step 5: Get application logs for more insights
    console.log('\n📋 Recent Vamsh Logs:');
    console.log('======================');
    
    try {
      const logs = await vamshService.getLogs();
      if (logs && logs.length > 0) {
        console.log(`Found ${logs.length} log entries`);
        logs.slice(-5).forEach((log, index) => {
          console.log(`📝 Log ${logs.length - 4 + index}: ${log.substring(0, 150)}...`);
        });
      } else {
        console.log('No recent logs available');
      }
    } catch (error) {
      console.log('Could not retrieve logs');
    }

    // Step 6: Summary and recommendations
    console.log('\n🎯 Progress Summary:');
    console.log('====================');
    
    if (projectStatus.active) {
      console.log('✅ GREAT NEWS: The AI is actively working on your portfolio!');
      console.log('📊 Development is in progress');
      console.log('⏳ Check back in a few minutes for updates');
    } else if (projectStatus.recentMessages.length > 0) {
      console.log('⚠️  Project received but agent not active');
      console.log('🎮 Manual activation needed in Vamsh UI');
    } else {
      console.log('📋 Project is queued and ready for development');
      console.log('🚀 Next step: Activate the agent in Vamsh UI');
    }
    
    console.log('\n🔗 Vamsh UI Access:');
    console.log('   Frontend: http://localhost:3002');
    console.log('   Backend API: http://localhost:1337');
    console.log('   API Docs: http://localhost:1337/docs');

  } catch (error) {
    console.error('❌ Error checking progress:', error.message);
    console.error('Full error:', error);
  }
}

// Run the progress check
checkPortfolioProgress();
