import logo from './logo.svg';
import './App.css';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';

function User() {

  const [online, setOnline] = useState(false);

  const screenVideoRef = useRef();

  const socketRef = useRef();
  const peerConnectionRef = useRef();

  useEffect(async () => {
    await connectSocket();
    await enterName();
    await shareScreen();

    return () => {
      stopSharing();
    }
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
      console.log("p2p: receiving answer");
      if (data.event === 'answer') {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.data));
      }
      if (data.event === 'connect') {
        connectPeer();
      }
    }

    console.log("Web socket: connected");
  }

  function send(event, data) {
    socketRef.current.send(JSON.stringify({
      event : event,
      data : data
    }));
  }

  async function enterName() {
    await Swal.fire({
      title: 'Your name',
      input: 'text',
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: false,
      confirmButtonText: 'OK',
      showLoaderOnConfirm: true,
      allowOutsideClick: () => false
    }).then((result) => {
      console.log("Name: sending...");
      send("name", result);
      console.log("Name: sent");
    })
  }

  async function shareScreen() {
    await Swal.fire({
      title: 'Share screen',
      text: 'Allow screen sharing',
      icon: "warning"
    }).then(async (agree) => {
      await startSharing();
    });
  }

  function stopSharing() {
    screenVideoRef.current.srcObject && screenVideoRef.current.srcObject.getVideoTracks().forEach(function(track) {
      track.stop();
    });
    setOnline(false);
  }

  async function startSharing() {
    const constraints = {
      video: {
          cursor: "always"
      },
      audio: false
    };
    
    await navigator.mediaDevices.getDisplayMedia(constraints).then(async (screenStream) => {
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play();
      screenStream.getVideoTracks()[0].onended = () => {setOnline(false);}
      setOnline(true);
    }).catch(function(e) {
    });
  }

  function connectPeer() {
    if (peerConnectionRef.current) {
      //peerConnectionRef.current.close();
    }
    
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
    });

    peerConnectionRef.current.onicecandidate = function(event) {
      if (event.candidate) {
        socketRef.current.send(JSON.stringify({
          event : "candidate",
          data : event.candidate
        }))
      }
    }

    screenVideoRef.current.srcObject.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, screenVideoRef.current.srcObject));

    peerConnectionRef.current.createOffer().then(function(offer) {
      console.log("offering");
      return peerConnectionRef.current.setLocalDescription(offer);
    })
    .then(function() {
      socketRef.current.send(JSON.stringify({
        event: 'offer',
        data: peerConnectionRef.current.localDescription
      }));
    })
    .catch(function(reason) {
      // An error occurred, so handle the failure to connect
    });

  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          {online?'ONLINE':'NOT ONLINE'}
        </p>
        {!online && <a className="App-link" href="/" onClick={(e) => {e.preventDefault(); shareScreen()}}>
          CONNECT
        </a>}
      </header>
      <div style={{display: 'none'}}>
        <video ref={screenVideoRef} />
      </div>
    </div>
  );
}

export default User;
