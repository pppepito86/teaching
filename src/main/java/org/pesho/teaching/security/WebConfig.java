package org.pesho.teaching.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**")
			.allowedMethods("GET", "POST", "OPTIONS", "PUT", "DELETE", "HEAD")
			.allowedHeaders("*")
			.exposedHeaders("content-disposition")
			.allowCredentials(true);
	}
	
//	@Override
//	public void addViewControllers(ViewControllerRegistry registry) {
//	    registry.addViewController("/notfound").setViewName("forward:/index.html");
//	}
//	
//	@Bean
//	public WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> webServerFactoryCustomizer() {
//	    return (factory) -> factory.addErrorPages(new ErrorPage(HttpStatus.NOT_FOUND, "/notfound"));
//	}
//	
}
