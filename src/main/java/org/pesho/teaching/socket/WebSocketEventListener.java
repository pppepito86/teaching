package org.pesho.teaching.socket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {
	
	@Autowired
	private SocketService socketService;
    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
    	System.out.println("Websocket connected [user=" + event.getUser().getName() + "]");
    	if (!event.getUser().getName().equals("admin")) {
    		socketService.addUser(event.getUser().getName());
    	}
    	socketService.updateUsers();
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
    	System.out.println("Websocket disconnected [user=" + event.getUser().getName() + "]");
    	if (!event.getUser().getName().equals("admin")) {
    		socketService.removeUser(event.getUser().getName());
    		socketService.updateUsers();
    	}
    }
    
}