package org.pesho.teaching.socket;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

@Component
public class SocketHandler extends TextWebSocketHandler {

	private WebSocketSession clientSession;
	private WebSocketSession adminSession;
	private Map<String, WebSocketSession> sessionIdToSessionMap = Collections.synchronizedMap(new HashMap<>());
	private Map<String, String> userToSessionIdMap = Collections.synchronizedMap(new HashMap<>());
	private Map<String, String> sessionIdToUserMap = Collections.synchronizedMap(new HashMap<>());

	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message)
			throws InterruptedException, IOException {
		System.out.println(message.getPayload());
		System.out.println(adminSession);
		System.out.println(clientSession);
		
		Map<String, Object> messageMap = toMap(message.getPayload());
		String event = messageMap.get("event").toString();
		Object data = messageMap.get("data").toString();

		if ("name".equals(event)) {
			Map<String, Object> dataMap = toMap(data.toString());
			String name = dataMap.get("value").toString();
			userToSessionIdMap.put(name, session.getId());
			sessionIdToUserMap.put(session.getId(), name);
			System.out.println(name);
			if (name.equals("admin")) adminSession = session;
			
			usersUpdated();
		} if ("connect".equals(event)) {
			Map<String, Object> dataMap = toMap(data.toString());
			String name = dataMap.get("value").toString();
			clientSession = Optional.ofNullable(userToSessionIdMap.get(name))
					.map(sessionIdToSessionMap::get).orElse(null);
			if (clientSession != null) {
				clientSession.sendMessage(message);
			}
		} else if (clientSession != null && adminSession != null) {
			if (session.getId().equals(clientSession.getId())) {
				System.out.println("sending to admin");
				adminSession.sendMessage(message);
			} else if (session.getId().equals(adminSession.getId())) {
				System.out.println("sending to client");
				clientSession.sendMessage(message);
			}
		}
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		System.out.println("Connection established: " + session.getId());
		sessionIdToSessionMap.put(session.getId(), session);
	}
	
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		System.out.println("Connection removed: " + session.getId());
		if (adminSession != null && adminSession.getId().equals(session.getId())) adminSession = null;
		if (clientSession != null && clientSession.getId().equals(session.getId())) clientSession = null;
		userToSessionIdMap.remove(sessionIdToUserMap.get(session.getId()));
		sessionIdToUserMap.remove(session.getId());
		sessionIdToSessionMap.remove(session.getId());
		usersUpdated();
	}
	
	public void usersUpdated() throws IOException {
		if (adminSession != null) {
			List<String> users = userToSessionIdMap.keySet().stream().filter(u -> !u.equals("admin")).collect(Collectors.toList());
			Map<String, Object> usersMap = new HashMap<>();
			usersMap.put("value", users);
			Map<String, Object> map = new HashMap<>();
			map.put("event", "users");
			map.put("data", usersMap);
			TextMessage msg = new TextMessage(new Gson().toJson(map).getBytes());
			adminSession.sendMessage(msg);
			System.out.println(msg.getPayload());
		}
	}
	
	private Map<String, Object> toMap(String s) {
		return new Gson().fromJson(s, new TypeToken<Map<String, Object>>() {}.getType());
	}

}
