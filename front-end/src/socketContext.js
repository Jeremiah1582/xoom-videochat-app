import React, {createContext, useState, useRef, useEffect} from 'react';
import {io} from "socket.io-client";
import Peer from "simple-peer";

export const SocketContext = createContext();
// const socket = io('http://localhost:5000')
const socket = io('https://warm-wildwood-81069.herokuapp.com');

export const ContextProvider = ({children})=> { 
const[callAccepted, setCallAccepted]=useState(false)
const [stream, setStream] = useState(null)
const [me, setMe]=useState('')
const [call, setCall]= useState({})
const [name, setName]= useState('')


const[callEnded, setCallEnded]=useState(false)

const myVideo = useRef()
const userVideo = useRef()
const connectionRef = useRef()

useEffect(() => {
    navigator.mediaDevices.getUserMedia({video: true, audio:true})
        .then((currentStream)=>{
            setStream(currentStream);

            myVideo.current.srcObject = currentStream ; //here we are setting my Video as the caller  
        });
        socket.on('me', (id)=>setMe(id))

        socket.on('callUser', ({from, name:callerName, signal})=>{
            setCall({isReceivingCall:true, from, name: callerName, signal})
        });

}, []);
   

   const answerCall =()=>{
       setCallAccepted(true)
       const peer = new Peer({initiator: false, trickle: false, stream })

       peer.on('signal', (data)=>{
           socket.emit('answerCall', {signal:data, to:call.from})
       });

       peer.on('stream', (currentStream)=>{ // here we are setting the other users video as a receiver 
       userVideo.current.srcObject = currentStream;
       });
       peer.signal(call.signal);
       connectionRef.current =peer
   }

   const callUser =(id)=>{
    const peer = new Peer({initiator: true, trickle: false, stream })

       peer.on('signal', (data)=>{
           socket.emit('callUser', {userToCall: id, signalData:data, from: me, name})
       });


       peer.on('stream', (currentStream)=>{ // here we are setting the other users video as a receiver 
       userVideo.current.srcObject = currentStream;
        });
       socket.on('callAccepted', (signal)=>{
           setCallAccepted(true);

           peer.signal(signal)
       });

       connectionRef.current =peer;
   };
   const leaveCall =()=>{
       setCallEnded(true);
       connectionRef.current.destroy()
       window.location.reload() //this will reload the page and provide a new id 

   }

   return (
       <SocketContext.Provider value={{ call, callAccepted, myVideo, userVideo, stream, name, setName, callEnded, me, callUser, leaveCall, answerCall,}}>
       {children}
       </SocketContext.Provider>
   );

};




