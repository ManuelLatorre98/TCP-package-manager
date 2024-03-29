import {fromLittleEndian, toLittleEndian} from "./toLittleEndian";
import {ApiResponse} from "./customTypes";
global.Buffer = require('buffer').Buffer;

export class PackageManager {
  private messageBuffer: Buffer | null = null
  private messageLength: number | null = null
  private msgPointer: number = 0;
  private decodedMsg: Buffer[] = []
  private amountOfBytes= 4
  private messageReaded=0
  private lengthBytes: Buffer | null = null
  private subArrayLengthBytes: Buffer | null = null
  private lengthReaded= 0

  constructor() {
    this.msgPointer = 0
  }

  /**
   * Handles the received data, either in string or buffer format.
   * If a string is received, it converts it to Buffer in UTF-8 format.
   * Reads the received data to determine the message length and the message itself.
   * 
   * @param data The received data, can be a string or a buffer.
   * @returns An array with the decoded messages.
   */
  public manageData(data: string | Buffer): Buffer[] {
    if (typeof data == "string") {
      data = Buffer.from(data, 'utf-8')
    }

    while (data.length > this.msgPointer) {
      if (this.messageLength === null) {
        
        this.readMessageLength(data) /* Reads the message length */
        /*
        * It may happen that the length arrives along with the message in the same datagram
        * if the message length is read and the datagram itself contains the message, it reads it
        */
        if (this.messageLength != null && data.length > this.msgPointer) {
          this.readMessage(data)
        }
      } else { /* If the length has already been read and waiting for the message */
        this.readMessage(data)
      }
    }
    this.msgPointer = 0
    let auxDecodedMsg: Buffer[] =[]
    if(this.decodedMsg.length > 0){
      auxDecodedMsg =Object.assign([], this.decodedMsg)
      this.decodedMsg = []
    }
    return auxDecodedMsg
  }

  /**
   * Reads the length of the message from the data buffer.
   * 
   * @param data The buffer containing the data.
   */
  private readMessageLength(data: Buffer) {
    const remainingBytes = this.amountOfBytes - this.lengthReaded
    this.subArrayLengthBytes = data.subarray(this.msgPointer, this.msgPointer + remainingBytes);
    this.msgPointer += this.subArrayLengthBytes.length
    this.lengthReaded += this.subArrayLengthBytes.length
    if (this.lengthBytes === null) {
      this.lengthBytes = this.subArrayLengthBytes
    } else if (this.lengthBytes.length < this.amountOfBytes) {
      this.lengthBytes = Buffer.concat([this.lengthBytes, this.subArrayLengthBytes])
    }
    /* If finished reading the message length, it translates it */
    if (this.lengthReaded == this.amountOfBytes) {
      this.lengthReaded = 0
      this.messageLength = fromLittleEndian(this.lengthBytes);
    }
  }

  /**
   * Reads the message from the data buffer.
   * 
   * @param data The buffer containing the message.
  */
  private readMessage(data: Buffer){
    let message
    let managedData
    if(this.messageLength!=null){
      message = data.subarray(this.msgPointer, (this.msgPointer + (this.messageLength-this.messageReaded)));/* Reads the message */
      managedData = this.handleMessageData(message)
      if(managedData!=undefined){
        this.decodedMsg.push(managedData)
        
      }

      this.msgPointer +=message.length
      this.messageReaded+=message.length // Indicates that x bytes have been read

      /* Checks if the message is fully read */
      if(data.length > this.msgPointer && this.messageReaded == this.messageLength){
        /* If finished reading a message, but there is more information available, reset variables to continue reading */
        this.startNewMessage()
      }
    }
  }

/**
 * Resets the variables to start reading a new message.
 */
  private startNewMessage(){
    this.messageLength = null
    this.messageBuffer = null
    this.messageReaded = 0
    this.lengthBytes=null
  }

  /**
   * Handles the received message data.
   * 
   * @param messageData The buffer containing the message data.
   * @returns The complete message bytes if available, otherwise null.
   */
  private handleMessageData = (messageData: Buffer) => {
    let messageBytes:Buffer =Buffer.from('')
    
    if (this.messageBuffer === null) {
      this.messageBuffer = messageData;
    } else {
      this.messageBuffer = Buffer.concat([this.messageBuffer, messageData]);
    }
    // Check if the complete message has been received
    if (this.messageLength!=null && this.messageBuffer.length >= this.messageLength) {
      messageBytes =this.messageBuffer.subarray(0, this.messageLength)
      this.messageBuffer=null
    }
    return messageBytes
  }

  /**
   * Translates an array of message bytes into an array of parsed messages.
   * 
   * @param messagesBytes An array containing the message bytes to translate.
   * @returns An array of parsed messages.
  */
  public translateMessages(messagesBytes:Buffer[]) :any[]{
    let messages:any=[]
    if(messagesBytes.length>0){
      messages = messagesBytes.map((message)=>{
      const messageString = String.fromCharCode.apply(null, Array.from(message));
      const resp=JSON.parse(messageString)
      return resp
      })
    }
    return messages
  }

  /**
   * Sends a message over the provided socket.
   * 
   * @param socket The socket to send the message through.
   * @param message The message to send.
   * @returns A Promise that resolves with an ApiResponse if the message is successfully sent, or rejects with an ApiResponse if there is an error.
  */
  sendMessage(socket: any, message: string): Promise<ApiResponse>{
    return new Promise((resolve, reject)=>{
      try {
        const dataToSend = JSON.stringify(message)
        const littleEndian = toLittleEndian(new Blob([dataToSend]).size);
        socket.write(littleEndian) //This shall use the method to send message provided by the TCP library. I asume that is socket.write 
        socket.write(dataToSend)
        resolve(new ApiResponse(200, "Message sended to client"))
      }catch(e){
        console.error("packageManager: sendMessage")
        console.error(e)
        reject(new ApiResponse(500, "Error sending message"))
      }
    })
  }
}