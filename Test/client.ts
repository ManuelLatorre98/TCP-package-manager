import { PackageManager } from '../src/PackageManager';
import * as net from 'net';

const client = new net.Socket();

const PORT = 3000;
const HOST = '127.0.0.1';
const dataManager: PackageManager = new PackageManager();
client.connect(PORT, HOST, () => {
  console.log('Connected to server');
  client.write('Send me data!');
});

client.on('data', (data: any) => {
  console.log('Datagram received in bytes: ' + data.toString('hex'));
  let messageBytes = dataManager.manageData(data); /* Manage the data received and get and array of messages */
  let messages = dataManager.translateMessages(messageBytes) /* Translates the array of message bytes into an array of parsed messages. */
  if(messages.length>0)
    console.log(`Messages: ${JSON.stringify(messages)}`);
});

client.on('close', () => {
  console.log('Conexión cerrada');
});