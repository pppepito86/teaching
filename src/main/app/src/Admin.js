import './App.css';
import { useEffect, useRef, useState } from 'react';

function Admin() {

  const screenVideoRef = useRef();
  const socketRef = useRef();
  const peerConnectionRef = useRef();

  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function connect() {
      await connectSocket();
    }

    connect();
  }, []);

  function waitForOpenSocket(socket) {
    return new Promise((resolve) => {
      if (socket.readyState !== socket.OPEN) {
        socket.addEventListener("open", (_) => {
          resolve();
        })
      } else {
        resolve();
      }
    });
  }

  async function connectSocket() {
    console.log("Web socket: connecting...");
    socketRef.current = new WebSocket(`wss://${process.env.REACT_APP_URL}/socket`);
    await waitForOpenSocket(socketRef.current);

    socketRef.current.onmessage = function (event) {
      var data = JSON.parse(event.data);
      console.log(data.data);
      if (data.event === 'offer') {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.data));
        peerConnectionRef.current.createAnswer().then(function(answer) {
          console.log(answer);
          return peerConnectionRef.current.setLocalDescription(answer);
        })
        .then(function() {
          send('answer',peerConnectionRef.current.localDescription);
        })
        .catch(function(reason) {
          // An error occurred, so handle the failure to connect
        });
      }
      if (data.event === 'candidate') {
        console.log("add candidate" + data);
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.data));
      }
      if (data.event === 'users') {
        setUsers(data.data.value);
      }
    }

    send('name', {value: 'admin'});

    console.log("Web socket: connected");
  }

  function send(event, data) {
    socketRef.current.send(JSON.stringify({
      event : event,
      data : data
    }));
  }

  async function connectPeer(user) {
    if (peerConnectionRef.current) peerConnectionRef.current.close();

    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302'
        }
      ]
    });

    peerConnectionRef.current.ontrack = function(event) {
      console.log("stream received");
      screenVideoRef.current.srcObject = event.streams[0];
    };

    send('connect', {value: user});
  }

  return (
    <div id='container' className="App">
      <h1><span>Teaching App</span></h1>
      <video ref={screenVideoRef} playsInline autoPlay muted controls />
      <div>
      {
        users.map((user) =>
          <button key={user} onClick={() => connectPeer(user)}>{user}</button>
        )
      }
      </div>
    </div>
  );
}

export default Admin;
