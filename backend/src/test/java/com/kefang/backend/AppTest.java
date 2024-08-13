package com.kefang.backend;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AppTest {

	private final Logger logger = LoggerFactory.getLogger(AppTest.class);

	@Test
	void testLoadContext() {
		logger.info("Context loaded");
	}
}
