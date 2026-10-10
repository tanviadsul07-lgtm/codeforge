import net from 'net';
import { execSync } from 'child_process';

const PORTS = [
  { port: 3002, name: 'Frontend (Vite)' },
  { port: 5000, name: 'Backend (Express/Node)' }
];

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port);
  });
}

function verifyAndFreePortOnWindows(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = output.split(/\r?\n/).filter(l => l.includes('LISTENING'));
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        pids.add(pid);
      }
    }

    pids.forEach(pid => {
      try {
        let cmdLine = '';
        try {
          cmdLine = execSync(`wmic process where "ProcessId=${pid}" get CommandLine 2>NUL`).toString();
        } catch (e) {}

        const isProjectProcess = cmdLine.includes('fusion26') || 
                                 cmdLine.includes('server') || 
                                 cmdLine.includes('vite') || 
                                 cmdLine.includes('node');

        if (isProjectProcess || !cmdLine.trim()) {
          console.log(`[Port Check] Port ${port} is occupied by verified project PID ${pid}. Releasing port...`);
          execSync(`taskkill /F /PID ${pid}`);
          console.log(`[Port Check] PID ${pid} released successfully.`);
        } else {
          console.warn(`[Port Check Warning] Port ${port} is occupied by non-project process (PID ${pid}). Please stop PID ${pid}.`);
        }
      } catch (e) {
        // Process might have already exited
      }
    });
  } catch (e) {
    // findstr returned no matches (port is free)
  }
}

async function checkAndPreparePorts() {
  console.log('==================================================');
  console.log(' PathRakshak AI — Port Pre-Flight Check');
  console.log('==================================================');

  for (const { port, name } of PORTS) {
    const occupied = await isPortInUse(port);
    if (occupied) {
      console.log(`[Port Check] ${name} port ${port} is occupied.`);
      if (process.platform === 'win32') {
        verifyAndFreePortOnWindows(port);
      }
    } else {
      console.log(`[Port Check] ${name} port ${port} is FREE.`);
    }
  }

  console.log('==================================================\n');
}

checkAndPreparePorts().catch(console.error);
