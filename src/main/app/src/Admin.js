import logo from './logo.svg';
import './App.css';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';

function Admin() {

  const screenVideoRef = useRef();

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

  async function connect() {
    var conn = new WebSocket(`wss://${process.env.REACT_APP_URL}/socket`);
    await waitForOpenSocket(conn);
  
      var peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: 'stun:stun.l.google.com:19302'
          }
        ]
      });

      peerConnection.ontrack = function(event) {
        console.log("stream received");
        screenVideoRef.current.srcObject = event.streams[0];
        //screenVideoRef.current.play();
      };

      conn.onmessage = function (event) {
        var data = JSON.parse(event.data);
        console.log(data.data);
        if (data.event === 'offer') {
          peerConnection.setRemoteDescription(new RTCSessionDescription(data.data));
          peerConnection.createAnswer().then(function(answer) {
            console.log(answer);
            return peerConnection.setLocalDescription(answer);
          })
          .then(function() {
            conn.send(JSON.stringify({
              event: 'answer',
              data: peerConnection.localDescription
            }));
          })
          .catch(function(reason) {
            // An error occurred, so handle the failure to connect
          });
        }
        if (data.event === 'candidate') {
          console.log("add candidate" + data);
          peerConnection.addIceCandidate(new RTCIceCandidate(data.data));
        }
      }
  }

  useEffect(async () => {
    connect();

  }, []);

  return (
    <div className="App">
      <div>
        <video ref={screenVideoRef} playsInline autoPlay muted controls />
      </div>
    </div>
  );
}

export default Admin;
