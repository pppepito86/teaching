package org.pesho.teaching.socket;

import java.io.IOException;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

@Controller
public class SocketController {
	
	@Autowired
    private SocketService socketService;
	
	@Autowired
	private SimpMessagingTemplate template;

	private String clientName = null;
	
	@MessageMapping("/welcome")
	public void welcome(Principal principal, String message) throws Exception {
		if (principal.getName().equals("admin")) socketService.updateUsers();
	}
	
	@MessageMapping("/connect")
	public void connect(Principal principal, String message) throws Exception {
		handleTextMessage(principal, message);
	}
	
	public void handleTextMessage(Principal principal, String message)
			throws InterruptedException, IOException {
		Map<String, Object> messageMap = toMap(message);
		String event = messageMap.get("event").toString();
		Object data = messageMap.get("data").toString();
		
		if ("screen".equals(event)) {
			System.out.println(message);
		} else if ("connect".equals(event)) {
			Map<String, Object> dataMap = toMap(data.toString());
			clientName = dataMap.get("value").toString();
			template.convertAndSendToUser(clientName, "/queue/message", message);
		} else if (clientName != null) {
			if ("admin".equals(principal.getName())) {
				template.convertAndSendToUser(clientName, "/queue/message", message);				
			} else {
				template.convertAndSendToUser("admin", "/queue/message", message);
			}
		}
	}
	
	private Map<String, Object> toMap(String s) {
		return new Gson().fromJson(s, new TypeToken<Map<String, Object>>() {}.getType());
	}
	
}
