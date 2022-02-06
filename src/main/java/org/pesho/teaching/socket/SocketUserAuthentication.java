package org.pesho.teaching.socket;

import org.apache.http.auth.BasicUserPrincipal;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

@Component
public class SocketUserAuthentication implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, final MessageChannel channel) throws AuthenticationException {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (StompCommand.CONNECT == accessor.getCommand()) {
            String username = accessor.getLogin();
            String password = accessor.getPasscode();
            accessor.setUser(new BasicUserPrincipal(username));
        }
        return message;
    }
    
}