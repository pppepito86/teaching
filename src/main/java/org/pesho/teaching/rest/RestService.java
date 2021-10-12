package org.pesho.teaching.rest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api")
public class RestService {

    @GetMapping("/**")
    public String user() {
    	return "hellouser"; 
    }

    @GetMapping("/admin")
    public String admin() {
    	return "helloadmin"; 
    }

}
