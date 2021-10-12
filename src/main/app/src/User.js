import logo from './logo.svg';
import './App.css';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';

function User() {

  const screenVideoRef = useRef();
  const screenCanvasRef = useRef();

  const [conn, setConn] = useState();
  const [peerConnection , setPeerConnection ] = useState();


  const constraints = {
    video: {
        cursor: "always"
        
    },
    audio: false
    // deviceId: "screen:0:0",
  };

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

  function startScreen() {
    navigator.mediaDevices.getDisplayMedia(constraints).then(async (screenStream) => {
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play();
      screenStream.getVideoTracks()[0].onended = () => {}

      var conn = new WebSocket(`wss://${process.env.REACT_APP_URL}/socket`);
      await waitForOpenSocket(conn);

      conn.onmessage = function (event) {
        var data = JSON.parse(event.data);
        console.log("answer" + event.data);
        if (data.event === 'answer') {
          peerConnection.setRemoteDescription(new RTCSessionDescription(data.data));
        }
      }
  
      var servers;
      var peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: 'stun:stun.l.google.com:19302'
          }
        ]
      });
  
      peerConnection.onicecandidate = function(event) {
        if (event.candidate) {
          conn.send(JSON.stringify({
            event : "candidate",
            data : event.candidate
          }))
        }
      }
  
      screenStream.getTracks().forEach(track => peerConnection.addTrack(track, screenStream));

      peerConnection.createOffer().then(function(offer) {
        console.log("offering");
        return peerConnection.setLocalDescription(offer);
      })
      .then(function() {
        conn.send(JSON.stringify({
          event: 'offer',
          data: peerConnection.localDescription
        }));
      })
      .catch(function(reason) {
        // An error occurred, so handle the failure to connect
      });

    }).catch(function(e) {
    });
  }

  useEffect(async () => {
    Swal.fire({
        title: 'Share screen',
        text: 'Allow screen sharing',
        icon: "warning"
    }).then(async (agree) => {
      startScreen();
    });

    return () => {
      screenVideoRef.current.srcObject && screenVideoRef.current.srcObject.getVideoTracks().forEach(function(track) {
        track.stop();
      });
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          User Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      {/* <div style={{display: 'none'}}> */}
      <div>
        <video ref={screenVideoRef} />
        <canvas ref={screenCanvasRef} />
      </div>
    </div>
  );
}

export default User;
