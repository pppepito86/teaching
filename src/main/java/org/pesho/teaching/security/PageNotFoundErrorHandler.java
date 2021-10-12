package org.pesho.teaching.security;

import java.util.Collections;

import org.springframework.boot.autoconfigure.web.servlet.error.ErrorViewResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.ModelAndView;

@Configuration
public class PageNotFoundErrorHandler {

	@Bean
	public ErrorViewResolver redirectToFrontEndOn404() {
		return ( request, status, model ) -> status == HttpStatus.NOT_FOUND
			? new ModelAndView("forward:/index.html", Collections.<String, Object>emptyMap(), HttpStatus.OK)
				: null;
	}
	
}
