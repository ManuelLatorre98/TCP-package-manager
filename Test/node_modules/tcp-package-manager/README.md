# TCP-PackageManager

TCP-PackageManager is a TypeScript library designed to facilitate sending and receiving TCP messages. Its main goal is to ensure smooth communication across various devices, making it especially suitable for mobile applications. By using little-endian encoding when sending data, TCP-PackageManager ensures compatibility and reliability in message transmission, regardless of the target platform or device architecture.

The key feature of TCP-PackageManager is its ability to handle message packaging on the client side, simplifying the process of unpacking and interpreting incoming data. This functionality streamlines message management and improves the efficiency of TCP communication within applications.

With its easy-to-use API, integrating TCP-PackageManager into a project is straightforward, allowing efforts to be focused on creating functionalities without worrying about the complexities of low-level TCP communication.

# Operating Protocol
The internal operating protocol is as follows:

## Server Side
1. TCP-PackageManager receives the message (of type string) to be transmitted as a parameter.
2. It calculates and sends the length of the message in bytes to the client. If necessary, it performs a conversion to little-endian to ensure that the byte order is always the same regardless of the device or architecture used (always 4 bytes). By calculating in bytes rather than characters, there is no need to worry about the use of "special" characters such as accents, the letter "ñ", kanji, etc., which often have a length greater than one byte.
3. It sends the message to the client.

## Client Side
1. TCP-PackageManager receives the received message as a parameter (string or Buffer type).
2. Firstly, it receives the length of the message sent by the server (4 bytes in little-endian), thus knowing the length of the next message to receive.
3. It receives the message sent by the server and decodes it. As many messages can arrive together in a single packet, an array of messages is returned.

![image](https://github.com/ManuelLatorre98/TCP-package-manager/assets/71223620/f9e3facf-1d62-49aa-9475-5039180c2fc5)

# Methods
## Server side
* ***PackageManager.sendMessage(socket, msg:string): Promise<ApiResponse>***: Receives a socket and the message and sends it to the client

ApiResponse is a type used in a custom protocol to return messages as follows:
* ***code*** : http code to represent the result of operation, in this case we use 200 as success and 500 as error
* ***message*** : Message response provided by the method as result
## Client side

* ***manageData(data: string | Buffer) : Buffer[]***: Receives as parameter the data and returns an Buffer array of message bytes

* ***translateMessages(messagesBytes : Buffer[]) : any[]:*** Receives as parameter the array of message bytes and return an array of parsed messages.
# Usage Example
Below is a simplified example:

## Server Side Code
```bash
import { PackageManager } from "./TCP_PackageManager/PackageManager";
import * as net from 'net';

const server = net.createServer((socket: any) => {
console.log('New client connected');

socket.on('data', async(data: any) => {
    console.log(`Received data from client: ${data}`);

    PackageManager.sendMessage(socket, ("Hello World!"))
    /*PackageManager.sendMessage(socket, ("Hello World!2"))
    PackageManager.sendMessage(socket, ("Hello World!3"))*/
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
```
## Server Side OutPut
```bash
Server listening in 127.0.0.1:3000
New client connected
Received data from client: Send me data!
```

## Client Side Code
```bash
import { PackageManager } from "./TCP_PackageManager/PackageManager";
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
```
## Client Side OutPut
Different situations are presented below depending on how the datagrams reach the client.
### First Example: Messages Received in Two Different Datagrams
```bash
Connected to server
Datagram received in bytes: 0000000e
Datagram received in bytes: 2248656c6c6f20576f726c642122
Messages: ["Hello World!"]
```

### Second Example: Messages Received in a Single Datagram
```bash
Connected to server
Datagram received in bytes: 0000000e2248656c6c6f20576f726c642122
Messages: ["Hello World!"]
```

### Third example: The server sends three consecutive messages (commented in the example code), and client receives all (length, and messages) in two datagrams
```bash
Connected to server
Datagram received in bytes: 0000000e
Datagram received in bytes: 2248656c6c6f20576f726c6421220000000f2248656c6c6f20576f726c642132220000000f2248656c6c6f20576f726c64213322
Messages: ["Hello World!","Hello World!2","Hello World!3"]
```

### Fourth example: An alernative case of third example
```bash
Connected to server
Datagram received in bytes: 0000000e2248656c6c6f20576f726c642122
Messages: ["Hello World!"]
Datagram received in bytes: 0000000f2248656c6c6f20576f726c642132220000000f2248656c6c6f20576f726c64213322
Messages: ["Hello World!2","Hello World!3"]
```
