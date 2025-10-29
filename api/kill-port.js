/**
 * Kill process running on specified port
 * Works on Windows
 */

const { execSync } = require('child_process');

const port = process.argv[2] || 5000;

console.log(`Checking for processes on port ${port}...`);

try {
  // Find process using the port
  const findCommand = `netstat -ano | findstr :${port}`;
  const result = execSync(findCommand, { encoding: 'utf8' });

  if (result) {
    // Extract PIDs from netstat output
    const lines = result.split('\n').filter(line => line.trim());
    const pids = new Set();

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(pid);
      }
    });

    // Kill each process
    pids.forEach(pid => {
      try {
        console.log(`Killing process ${pid} on port ${port}...`);
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`Process ${pid} killed successfully`);
      } catch (err) {
        // Process might already be dead
      }
    });

    console.log(`Port ${port} is now free`);
  } else {
    console.log(`No process found on port ${port}`);
  }
} catch (error) {
  if (error.message.includes('command failed')) {
    console.log(`No process found on port ${port}`);
  } else {
    console.error(`Error: ${error.message}`);
  }
}
