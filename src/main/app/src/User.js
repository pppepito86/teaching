import logo from './logo.svg';
import './App.css';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import * as SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';

function User() {

  const [online, setOnline] = useState(false);

  const nameRef = useRef();
  const screenVideoRef = useRef();

  const socketRef = useRef();
  const stompClientRef = useRef();
  const peerConnectionRef = useRef();

  useEffect(async () => {
    await enterName();
    await connectSocket();
    await shareScreen();

    return () => {
      stopSharing();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // stompClientRef.current.send("/app/connect", {}, "hello123");
    }, 5000)
  
    return () => clearInterval(interval)
  }, [])

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
    const sock = new SockJS(`https://${process.env.REACT_APP_URL}/ws`);
    const stompClient = Stomp.over(sock);

    stompClient.connect(nameRef.current.value, '',
      function() {
        stompClient.send("/app/welcome", {}, "welcome");
        
        stompClient.subscribe(`/topic/announcements`, function (msg) {
        });

        stompClient.subscribe('/user/queue/message', function (msg) {
          var data = JSON.parse(msg.body);
          console.log("p2p: receiving answer");
          if (data.event === 'candidate') {
            console.log("add candidate" + data);
            peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.data));
          }
          if (data.event === 'answer') {
            peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.data));
          }
          if (data.event === 'connect') {
            connectPeer();
          }
        });
        
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

  async function enterName() {
    const { value: name } = await Swal.fire({
      title: 'Your name',
      input: 'text',
      inputValidator: (value) => {
        if (!value) {
          return 'Enter your name!'
        }
      },
      allowOutsideClick: () => false
    });
    
    if (name) {
      nameRef.current = {value: name};
    } else {
      await enterName();
    }
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
      var videoTrack = screenStream.getVideoTracks()[0];
      console.log({name: nameRef.current.value, data: videoTrack.getSettings()});
      send("screen", {name: nameRef.current.value, data: videoTrack.getSettings()});

      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play();
      screenStream.getVideoTracks()[0].onended = () => {setOnline(false);}
      setOnline(true);
    }).catch(function(e) {
    });
  }

  function connectPeer() {
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (!screenVideoRef.current.srcObject) return;

    
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
    });

    screenVideoRef.current.srcObject.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, screenVideoRef.current.srcObject));

    peerConnectionRef.current.onicecandidate = function(event) {
      if (event.candidate) {
        send("candidate", event.candidate);
      }
    }

    peerConnectionRef.current.createOffer().then(function(offer) {
      console.log("offering");
      return peerConnectionRef.current.setLocalDescription(offer);
    })
    .then(function() {
      send('offer', peerConnectionRef.current.localDescription);
    })
    .catch(function(reason) {
      // An error occurred, so handle the failure to connect
    });

  }

  return (
    <div id='app' className="App">
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
