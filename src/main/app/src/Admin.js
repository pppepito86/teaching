import './App.css';
import { useEffect, useRef, useState } from 'react';
import * as SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';

function Admin() {

  const screenVideoRef = useRef();
  const stompClientRef = useRef();
  const peerConnectionRef = useRef();

  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function connect() {
      await connectSocket();
    }

    connect();
  }, []);

  async function connectSocket() {
    const sock = new SockJS(`${process.env.REACT_APP_URL}/ws`);
    const stompClient = Stomp.over(sock);

    stompClient.connect('admin', '',
      function() {
        stompClient.subscribe(`/topic/announcements`, function (msg) {
        });

        stompClient.subscribe('/user/queue/message', function (msg) {
          var data = JSON.parse(msg.body);
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
            console.log("users here")
            setUsers(data.data.value);
          }
        });
        
        stompClient.send("/app/welcome", {}, "welcome");

        stompClientRef.current = stompClient;
      },
      function stompFailure(error) {
        console.log(error);
          setTimeout(connectSocket, 2000);
      }
    );
  }

  function send(event, data) {
    const msg = JSON.stringify({
      event : event,
      data : data
    });

    stompClientRef.current.send("/app/connect", {}, msg);
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

    peerConnectionRef.current.onicecandidate = function(event) {
      if (event.candidate) {
        send("candidate", event.candidate);
      }
    }

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
