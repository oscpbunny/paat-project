# PAAT Troubleshooting Guide
**AI Personal Assistant Agent Tool - Support & Troubleshooting**

## Table of Contents
1. [Quick Diagnostic Tools](#quick-diagnostic-tools)
2. [Common Issues](#common-issues)
3. [Installation Problems](#installation-problems)
4. [AI Integration Issues](#ai-integration-issues)
5. [Performance Problems](#performance-problems)
6. [Database Issues](#database-issues)
7. [File Monitoring Problems](#file-monitoring-problems)
8. [Frequently Asked Questions](#frequently-asked-questions)
9. [Error Reference](#error-reference)
10. [Getting Support](#getting-support)
11. [System Diagnostics](#system-diagnostics)

## Quick Diagnostic Tools

### Built-in Diagnostics

PAAT includes built-in diagnostic tools to help identify common issues:

1. **Health Check**
   - Go to `Help` → `System Diagnostics`
   - This will check all core systems and report any issues

2. **Connection Test**
   - Go to `Settings` → `AI Services`
   - Click "Test Connection" for each configured service

3. **Log Viewer**
   - Go to `Help` → `Show Logs`
   - Review recent error messages and warnings

4. **Database Integrity Check**
   - Go to `Help` → `Database Tools` → `Check Integrity`
   - This will verify your project database is healthy

### Command Line Diagnostics

For advanced troubleshooting, you can run PAAT with debugging enabled:

```bash
# Windows
set DEBUG=paat:* && paat.exe

# macOS/Linux
DEBUG=paat:* paat

# Or start from source
DEBUG=paat:* npm start
```

## Common Issues

### Application Won't Start

#### **Issue**: PAAT crashes immediately on startup

**Possible Causes:**
- Corrupted application data
- Insufficient permissions
- Conflicting software
- System requirements not met

**Solutions:**

1. **Clear Application Data**
   ```bash
   # Windows
   del /s "%APPDATA%\PAAT\*"
   
   # macOS
   rm -rf ~/Library/Application\ Support/PAAT
   
   # Linux
   rm -rf ~/.config/PAAT
   ```

2. **Run with Administrator/Root Privileges**
   - Windows: Right-click PAAT → "Run as administrator"
   - macOS: `sudo open -a PAAT`
   - Linux: `sudo paat`

3. **Check System Requirements**
   - Verify you have at least 8GB RAM
   - Ensure 2GB free disk space
   - Update to latest OS version

4. **Disable Antivirus Temporarily**
   - Some antivirus software may block PAAT
   - Add PAAT to antivirus whitelist

#### **Issue**: "Application failed to start correctly" error on Windows

**Solutions:**

1. **Install Visual C++ Redistributables**
   - Download and install Microsoft Visual C++ Redistributable
   - Both x64 and x86 versions may be needed

2. **Check Windows Updates**
   - Install all pending Windows updates
   - Restart computer after updates

3. **Run System File Checker**
   ```cmd
   sfc /scannow
   ```

### Slow Performance

#### **Issue**: PAAT runs slowly or freezes frequently

**Common Causes:**
- Large project directories being monitored
- Multiple AI models loaded simultaneously
- Insufficient system resources
- Background processes consuming resources

**Solutions:**

1. **Reduce File Monitoring Scope**
   - Go to `Settings` → `Project Settings`
   - Uncheck directories you don't need to monitor
   - Exclude `node_modules`, `.git`, and build directories

2. **Optimize AI Model Usage**
   - Use lighter models (Gemma3:1b) for quick tasks
   - Switch to Qwen2.5:7b only when needed
   - Close unused AI model instances

3. **Increase Memory Allocation**
   - Close other applications while using PAAT
   - Consider upgrading RAM if consistently hitting limits

4. **Clean Database**
   ```bash
   # From PAAT directory
   npm run db:clean
   npm run db:optimize
   ```

#### **Issue**: High CPU usage even when idle

**Solutions:**

1. **Check File Monitoring**
   - Large directories may cause excessive file system polling
   - Reduce monitoring scope or increase polling interval

2. **Disable Unnecessary Features**
   - Turn off real-time AI analysis
   - Reduce auto-save frequency
   - Disable background project scanning

3. **Update to Latest Version**
   - Newer versions include performance optimizations
   - Check `Help` → `Check for Updates`

### Data Loss or Corruption

#### **Issue**: Projects or tasks disappeared

**Immediate Actions:**

1. **Check Backup Location**
   ```bash
   # Windows
   dir "%APPDATA%\PAAT\backups"
   
   # macOS
   ls ~/Library/Application\ Support/PAAT/backups
   
   # Linux
   ls ~/.config/PAAT/backups
   ```

2. **Restore from Backup**
   - Go to `File` → `Restore from Backup`
   - Select the most recent backup file
   - Choose what to restore (projects, tasks, settings)

3. **Check Database Integrity**
   - Go to `Help` → `Database Tools` → `Check Integrity`
   - If corruption detected, try `Repair Database`

**Prevention:**
- Enable auto-backup in settings
- Manually export important projects regularly
- Use version control (Git) for code projects

## Installation Problems

### Windows Installation Issues

#### **Issue**: "Windows protected your PC" SmartScreen warning

**Solution:**
1. Click "More info"
2. Click "Run anyway"
3. Or disable SmartScreen temporarily in Windows Security

#### **Issue**: Installation fails with "Access denied" error

**Solutions:**
1. Run installer as administrator
2. Temporarily disable antivirus
3. Check available disk space
4. Clear Windows temp files

#### **Issue**: NSIS installer error

**Solutions:**
1. Re-download installer (may be corrupted)
2. Run `chkdsk` to check disk for errors
3. Clear temp directory: `%TEMP%`
4. Try compatibility mode (Windows 8/7)

### macOS Installation Issues

#### **Issue**: "PAAT is damaged and can't be opened"

**Solutions:**
1. **Remove Quarantine Attribute**
   ```bash
   xattr -rd com.apple.quarantine /Applications/PAAT.app
   ```

2. **Allow Apps from Anywhere** (temporarily)
   ```bash
   sudo spctl --master-disable
   # Install PAAT, then re-enable:
   sudo spctl --master-enable
   ```

#### **Issue**: macOS Gatekeeper blocks installation

**Solutions:**
1. System Preferences → Security & Privacy
2. Click "Open Anyway" for PAAT
3. Or temporarily allow apps from "Anywhere"

### Linux Installation Issues

#### **Issue**: Package dependency errors

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -f
sudo apt-get install libgtk-3-0 libxss1 libnss3 libasound2
```

**CentOS/RHEL/Fedora:**
```bash
sudo yum update
sudo yum install gtk3 libXScrnSaver nss alsa-lib
# Or on newer versions:
sudo dnf install gtk3 libXScrnSaver nss alsa-lib
```

#### **Issue**: AppImage won't run

**Solutions:**
1. **Make Executable**
   ```bash
   chmod +x PAAT-3.0.0.AppImage
   ```

2. **Install FUSE** (if needed)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install fuse
   
   # CentOS/RHEL
   sudo yum install fuse
   ```

## AI Integration Issues

### Ollama Connection Problems

#### **Issue**: "Ollama service unavailable" error

**Diagnostic Steps:**

1. **Check if Ollama is Running**
   ```bash
   # Check if service is active
   ps aux | grep ollama
   
   # Check if port is listening
   netstat -an | grep 11434
   # Or on newer systems:
   ss -tlnp | grep 11434
   ```

2. **Test Ollama Directly**
   ```bash
   # Test API endpoint
   curl http://localhost:11434/api/version
   
   # List installed models
   ollama list
   ```

3. **Check Ollama Logs**
   ```bash
   # View recent logs
   journalctl -u ollama -f
   
   # Or check system logs
   tail -f /var/log/ollama.log
   ```

**Solutions:**

1. **Start Ollama Service**
   ```bash
   # Start service
   ollama serve
   
   # Or start as system service
   sudo systemctl start ollama
   sudo systemctl enable ollama
   ```

2. **Verify Model Installation**
   ```bash
   # Install recommended models
   ollama pull qwen2.5:7b
   ollama pull gemma2:2b
   ollama pull gemma:1b
   ```

3. **Check Firewall Settings**
   ```bash
   # Allow port 11434
   sudo ufw allow 11434
   
   # Or on CentOS/RHEL:
   sudo firewall-cmd --permanent --add-port=11434/tcp
   sudo firewall-cmd --reload
   ```

#### **Issue**: Model loading failures

**Common Causes:**
- Insufficient disk space for model files
- Corrupted model files
- Memory constraints

**Solutions:**

1. **Check Available Space**
   ```bash
   # Check disk space
   df -h
   
   # Check model directory size
   du -sh ~/.ollama/models
   ```

2. **Re-download Models**
   ```bash
   # Remove and re-download corrupted model
   ollama rm qwen2.5:7b
   ollama pull qwen2.5:7b
   ```

3. **Free Up Memory**
   - Close other applications
   - Use smaller models for testing
   - Restart Ollama service

#### **Issue**: Slow AI responses

**Optimization Steps:**

1. **Use Appropriate Models**
   - Gemma:1b for quick responses
   - Qwen2.5:7b for complex analysis
   - Don't use 8B+ models on systems with <16GB RAM

2. **Optimize Ollama Configuration**
   ```bash
   # Set memory constraints
   export OLLAMA_NUM_PARALLEL=1
   export OLLAMA_MAX_LOADED_MODELS=1
   
   # Start with constraints
   ollama serve
   ```

3. **Hardware Optimization**
   - Use SSD storage for model files
   - Ensure sufficient RAM (16GB+ recommended)
   - Close background applications

### Vamsh AI Integration

#### **Issue**: Cannot connect to Vamsh AI

**Diagnostic Steps:**

1. **Verify Vamsh Installation**
   ```bash
   # Check if Vamsh directory exists
   ls -la E:/vamsh  # Windows path example
   
   # Check if Vamsh process is running
   ps aux | grep vamsh
   ```

2. **Test Vamsh API**
   ```bash
   # Test health endpoint
   curl http://localhost:8000/health
   
   # Test projects endpoint
   curl http://localhost:8000/api/projects
   ```

**Solutions:**

1. **Start Vamsh Service**
   ```bash
   # Navigate to Vamsh directory
   cd E:/vamsh
   
   # Start Vamsh
   python main.py
   # Or if using virtual environment:
   ./venv/Scripts/activate && python main.py
   ```

2. **Check Configuration**
   - Verify Vamsh path in PAAT settings
   - Ensure API endpoint is correct (default: `http://localhost:8000`)
   - Check for port conflicts

3. **Update Connection Settings**
   - Go to `Settings` → `AI Services` → `Vamsh Settings`
   - Update installation path and API endpoint
   - Test connection

## Performance Problems

### Memory Issues

#### **Issue**: Out of memory errors

**Immediate Solutions:**

1. **Close Unnecessary Applications**
2. **Reduce AI Model Usage**
   - Use lighter models
   - Limit concurrent AI operations
3. **Clear Application Cache**
   - Go to `Settings` → `Advanced` → `Clear Cache`

**Long-term Solutions:**

1. **Increase System RAM**
2. **Use Virtual Memory/Swap**
   ```bash
   # Linux: Increase swap space
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

3. **Optimize Project Size**
   - Archive old projects
   - Exclude large directories from monitoring
   - Clean up temporary files

### Disk Space Issues

#### **Issue**: Low disk space warnings

**Solutions:**

1. **Clear Application Data**
   ```bash
   # Clear logs
   rm -rf ~/.config/PAAT/logs/*
   
   # Clear cache
   rm -rf ~/.config/PAAT/cache/*
   
   # Clear old backups
   find ~/.config/PAAT/backups -mtime +30 -delete
   ```

2. **Archive Old Projects**
   - Export completed projects
   - Remove from active database
   - Store archives externally

3. **Clean AI Model Cache**
   ```bash
   # Clear Ollama cache
   ollama rm unused-model
   
   # Clear download cache
   rm -rf ~/.ollama/tmp/*
   ```

## Database Issues

### Database Corruption

#### **Issue**: "Database is locked" or "Database corruption detected"

**Immediate Actions:**

1. **Close All PAAT Instances**
2. **Check for Lock Files**
   ```bash
   # Remove database lock files
   rm ~/.config/PAAT/*.db-lock
   rm ~/.config/PAAT/*.db-wal
   rm ~/.config/PAAT/*.db-shm
   ```

3. **Run Database Check**
   ```bash
   # Use SQLite command line
   sqlite3 ~/.config/PAAT/paat.db "PRAGMA integrity_check;"
   ```

**Recovery Steps:**

1. **Restore from Backup**
   - Most recent backup is usually safest
   - Go to `File` → `Restore from Backup`

2. **Repair Database**
   ```bash
   # Create backup first
   cp paat.db paat.db.backup
   
   # Attempt repair
   sqlite3 paat.db "REINDEX;"
   sqlite3 paat.db "VACUUM;"
   ```

3. **Rebuild Database**
   - Last resort option
   - Go to `Help` → `Database Tools` → `Rebuild Database`
   - This will recreate the database structure

### Performance Optimization

#### **Issue**: Slow database queries

**Solutions:**

1. **Database Maintenance**
   ```bash
   # Optimize database
   sqlite3 paat.db "VACUUM;"
   sqlite3 paat.db "ANALYZE;"
   ```

2. **Clear Old Data**
   - Archive completed projects
   - Clear old log entries
   - Remove orphaned records

3. **Check Database Size**
   ```bash
   # Check database file size
   ls -lh ~/.config/PAAT/paat.db
   
   # If too large, consider archiving
   ```

## File Monitoring Problems

### High CPU Usage from File Monitoring

#### **Issue**: File monitoring causing performance problems

**Solutions:**

1. **Reduce Monitoring Scope**
   - Exclude `node_modules` directories
   - Exclude build and cache directories
   - Limit depth of directory scanning

2. **Adjust Polling Frequency**
   - Go to `Settings` → `File Monitoring`
   - Increase polling interval
   - Use native file system events when available

3. **Use File Patterns**
   - Monitor only specific file types
   - Use gitignore-style patterns
   - Exclude binary files

### File Changes Not Detected

#### **Issue**: PAAT not detecting file changes

**Diagnostic Steps:**

1. **Check Monitoring Status**
   - Look for file monitor icon in status bar
   - Check if monitoring is enabled for the project

2. **Test with Simple File**
   - Create a new text file in monitored directory
   - Check if change appears in PAAT

**Solutions:**

1. **Restart File Monitoring**
   - Go to `Project Settings` → `File Monitoring`
   - Toggle monitoring off and on
   - Or restart PAAT

2. **Check File Permissions**
   - Ensure PAAT has read access to directories
   - Check if files are locked by other applications

3. **Update Monitoring Configuration**
   - Add specific file extensions
   - Check ignore patterns aren't too broad
   - Verify directory paths are correct

## Frequently Asked Questions

### General Usage

#### **Q: Can I use PAAT without AI features?**
A: Yes, PAAT functions as a project management tool without AI. You can disable AI features in Settings → AI Services.

#### **Q: How much disk space do AI models require?**
A: Model sizes vary:
- Gemma:1b: ~815MB
- Gemma2:2b: ~1.6GB
- Qwen2.5:7b: ~4.7GB
- Llama3.1:8b: ~4.9GB

#### **Q: Can I run PAAT on multiple computers?**
A: Yes, but projects are stored locally. You can export/import projects or use cloud storage for the project directory.

#### **Q: Is my data sent to external servers?**
A: No, PAAT is completely local-first. All data stays on your machine unless you explicitly export it.

### AI Integration

#### **Q: Which AI model should I use?**
A: 
- **Gemma:1b**: Quick responses, simple tasks
- **Gemma2:2b**: General purpose, good balance
- **Qwen2.5:7b**: Complex analysis, best quality
- **Llama3.1:8b**: Alternative to Qwen, similar quality

#### **Q: Can I use other AI models not listed?**
A: Yes, any Ollama-compatible model can be used. Install with `ollama pull model-name`.

#### **Q: Why are AI responses slow?**
A: Large models require significant processing. Consider:
- Using smaller models for quick tasks
- Ensuring adequate RAM (16GB+ recommended)
- Using SSD storage
- Closing other applications

### Project Management

#### **Q: How do I backup my projects?**
A: PAAT provides multiple backup options:
- Automatic backups (enabled by default)
- Manual export: `File` → `Export Project`
- Full backup: `File` → `Backup All Data`

#### **Q: Can I import projects from other tools?**
A: PAAT supports importing from:
- CSV files (tasks and projects)
- JSON exports from other tools
- Git repositories (automatic project detection)

#### **Q: How do I share projects with team members?**
A: Options include:
- Export project data
- Share project directory via cloud storage
- Use Git for code projects with PAAT configuration

### Troubleshooting

#### **Q: PAAT uses too much memory, what can I do?**
A: Memory optimization steps:
1. Use lighter AI models
2. Close unused projects
3. Reduce file monitoring scope
4. Clear cache regularly
5. Restart PAAT periodically

#### **Q: How do I completely reset PAAT?**
A: To reset everything:
1. Close PAAT
2. Delete configuration directory:
   - Windows: `%APPDATA%\PAAT`
   - macOS: `~/Library/Application Support/PAAT`
   - Linux: `~/.config/PAAT`
3. Restart PAAT

#### **Q: Where are log files located?**
A: Log locations:
- Windows: `%APPDATA%\PAAT\logs`
- macOS: `~/Library/Application Support/PAAT/logs`
- Linux: `~/.config/PAAT/logs`

## Error Reference

### Common Error Codes

#### **PAAT-001: Database Connection Failed**
- **Cause**: Database file is locked or corrupted
- **Solution**: Close all PAAT instances, remove lock files, restart

#### **PAAT-002: AI Service Unavailable**
- **Cause**: Ollama or Vamsh service not running
- **Solution**: Start the required AI service, check configuration

#### **PAAT-003: File Monitoring Failed**
- **Cause**: Insufficient permissions or invalid path
- **Solution**: Check file permissions, verify paths exist

#### **PAAT-004: Memory Allocation Error**
- **Cause**: Insufficient system memory
- **Solution**: Close other applications, use lighter AI models

#### **PAAT-005: Project Import Failed**
- **Cause**: Invalid project file format or corrupted data
- **Solution**: Verify file format, try different file

### Error Messages

#### "SQLite: database disk image is malformed"
**Cause**: Database corruption
**Solution**: 
1. Restore from backup
2. Or rebuild database using recovery tools

#### "Connection ECONNREFUSED"
**Cause**: AI service not accessible
**Solution**:
1. Check if service is running
2. Verify port configuration
3. Check firewall settings

#### "ENOSPC: no space left on device"
**Cause**: Insufficient disk space
**Solution**:
1. Free up disk space
2. Clear temporary files
3. Archive old projects

#### "Permission denied"
**Cause**: Insufficient file system permissions
**Solution**:
1. Run with administrator privileges
2. Check directory permissions
3. Change file ownership if needed

## Getting Support

### Before Contacting Support

1. **Check this troubleshooting guide**
2. **Review log files** (`Help` → `Show Logs`)
3. **Run system diagnostics** (`Help` → `System Diagnostics`)
4. **Try basic solutions** (restart, clear cache, etc.)

### What Information to Include

When reporting issues, please include:

1. **System Information**
   - Operating system and version
   - PAAT version
   - Available RAM and disk space

2. **Error Details**
   - Exact error message
   - Steps to reproduce
   - When the error first occurred

3. **Configuration**
   - AI services in use (Ollama, Vamsh)
   - Project types and sizes
   - Recent changes or updates

4. **Log Files**
   - Export logs from `Help` → `Show Logs` → `Export`
   - Include only relevant timeframe

### Support Channels

#### Community Support (Free)

1. **GitHub Issues** (Bug reports and feature requests)
   - https://github.com/your-org/paat-project/issues
   - Use appropriate issue templates
   - Search existing issues first

2. **Community Forum** (General questions and discussions)
   - https://community.paat.dev
   - Search before posting
   - Tag posts appropriately

3. **Documentation** (Self-service support)
   - User Manual: Complete usage guide
   - Developer Guide: Technical documentation
   - This troubleshooting guide

#### Premium Support (Paid)

For businesses and enterprises:

1. **Email Support**: support@paat.dev
   - Response within 24 hours
   - Includes remote assistance
   - Priority bug fixes

2. **Live Chat Support** (Business hours)
   - Available Monday-Friday, 9 AM - 5 PM EST
   - Immediate technical assistance
   - Screen sharing available

3. **Phone Support** (Enterprise only)
   - Dedicated support line
   - Escalation path for critical issues
   - Custom training available

### Support Response Times

| Support Tier | First Response | Resolution Target |
|--------------|----------------|-------------------|
| Community    | Best effort    | Best effort       |
| Premium      | 24 hours       | 3-5 business days |
| Enterprise   | 4 hours        | 1-2 business days |
| Critical     | 1 hour         | 4-8 hours         |

## System Diagnostics

### Built-in Diagnostic Tools

#### Health Check Report

Go to `Help` → `System Diagnostics` to generate a comprehensive health report:

```
PAAT System Health Report
========================
Generated: 2025-08-27 17:30:00

✓ Application Status: Running (v3.0.0)
✓ Database: Connected (integrity OK)
✓ File Monitoring: Active (3 projects monitored)
⚠ Ollama Service: Connected (high memory usage)
✗ Vamsh Service: Not configured

System Resources:
- Memory: 12.5 GB / 16 GB (78% used)
- Disk: 485 GB / 1 TB (48% used)
- CPU: Intel Core i7-9700K @ 3.60GHz

Recommendations:
- Consider using lighter AI models to reduce memory usage
- Configure Vamsh integration for advanced AI features
- Enable automatic backups in settings
```

#### Performance Monitor

Monitor real-time performance metrics:

- CPU usage by component
- Memory allocation breakdown
- Database query performance
- AI model response times
- File monitoring statistics

### Command Line Diagnostics

#### Environment Check

```bash
# Check Node.js version (required for development)
node --version

# Check npm version
npm --version

# Check SQLite version
sqlite3 --version

# Check Ollama installation
ollama --version

# Test network connectivity
curl -I http://localhost:11434/api/version
```

#### System Information

```bash
# Operating system details
uname -a

# Memory information
free -h  # Linux
vm_stat | grep free  # macOS
systeminfo | find "Total Physical Memory"  # Windows

# Disk space
df -h  # Linux/macOS
dir /-c  # Windows

# Running processes
ps aux | grep -i paat
ps aux | grep -i ollama
```

#### Log Analysis

```bash
# View recent PAAT logs
tail -n 50 ~/.config/PAAT/logs/main.log

# Search for errors
grep -i error ~/.config/PAAT/logs/*.log

# Monitor logs in real-time
tail -f ~/.config/PAAT/logs/main.log
```

### Performance Profiling

#### Memory Profiling

1. **Enable Memory Profiling**
   - Add `--inspect` flag when starting PAAT
   - Use Chrome DevTools for analysis

2. **Monitor Memory Usage**
   - Task Manager (Windows)
   - Activity Monitor (macOS)
   - htop/top (Linux)

3. **Identify Memory Leaks**
   - Watch for continuously growing memory usage
   - Check for unclosed database connections
   - Monitor AI model memory retention

#### CPU Profiling

1. **Identify Hot Spots**
   - Use system profiling tools
   - Monitor file monitoring threads
   - Check AI processing overhead

2. **Optimize Performance**
   - Reduce file monitoring scope
   - Use appropriate AI models
   - Implement lazy loading

---

## Recovery Procedures

### Complete System Recovery

If PAAT is completely unusable:

1. **Create Backup of User Data**
   ```bash
   # Copy entire PAAT directory
   cp -r ~/.config/PAAT ~/paat-recovery-backup
   ```

2. **Uninstall PAAT Completely**
   - Remove application
   - Clear configuration directories
   - Remove registry entries (Windows)

3. **Clean Installation**
   - Download latest PAAT version
   - Fresh installation
   - Do not restore settings initially

4. **Restore Data Selectively**
   - Import projects one by one
   - Test each import
   - Restore settings last

### Emergency Contacts

For critical system failures or data recovery:

- **Emergency Support**: emergency@paat.dev
- **Data Recovery**: recovery@paat.dev
- **Security Issues**: security@paat.dev

---

*This troubleshooting guide covers the most common issues with PAAT. For additional support, please visit our community forum or contact our support team.*

**Version**: 3.0.0  
**Last Updated**: August 2025  
**Support Team**: PAAT Technical Support
