// Healthcheck sederhana: proses exit code 0
setInterval(()=>{
  process.stdout.write('.'); // visible heartbeat
}, 30000);
