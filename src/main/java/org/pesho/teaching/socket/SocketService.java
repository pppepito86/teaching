package org.pesho.teaching.socket;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Component;

import com.google.gson.Gson;

@Component
public class SocketService {
	
	@Autowired
	private SimpMessagingTemplate template;
    
    @Autowired
    private SimpUserRegistry simpUserRegistry;
    
    private Set<String> users = new HashSet<>();
    
    public void addUser(String user) {
    	users.add(user);
    }
    
    public void removeUser(String user) {
    	users.remove(user);
    }
    
	public void updateUsers() {
		Map<String, Object> usersMap = new HashMap<>();
		usersMap.put("value", new ArrayList<>(users));
		Map<String, Object> map = new HashMap<>();
		map.put("event", "users");
		map.put("data", usersMap);
		String msg = new Gson().toJson(map).toString();
		template.convertAndSendToUser("admin", "/queue/message", msg);
	}

}
