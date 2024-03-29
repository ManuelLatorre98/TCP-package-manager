
import * as net from 'net';
const dataManager: PackageManager = new PackageManager();
const server = net.createServer((socket: any) => {
  console.log('New client connected');

  socket.on('data', async(data: any) => {
    console.log(`Received data from client: ${data}`);
   
    dataManager.sendMessage(socket, ("Hello World!"))
    /* dataManager.sendMessage(socket, ("Hello World!2"))
    dataManager.sendMessage(socket, ("Hello World!3")) */
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

const PORT = 3000;
const HOST = '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`Server listening in ${HOST}:${PORT}`);
});