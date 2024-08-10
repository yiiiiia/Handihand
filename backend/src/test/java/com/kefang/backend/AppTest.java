package com.kefang.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Date;
import java.util.Iterator;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.kefang.backend.db.entity.Account;
import com.kefang.backend.db.entity.Video;
import com.kefang.backend.db.repository.AccountRepository;
import com.kefang.backend.db.repository.VideoRepository;

@SpringBootTest
class AppTest {

	private final Logger logger = LoggerFactory.getLogger(AppTest.class);

	@Autowired
	private AccountRepository accountRepository;

	@Autowired
	private VideoRepository videoRepository;

	@Test
	void testLoadContext() {
		logger.info("This is just a simple loggign message: {}, {}, {}", 1, "hello,world", new Date());
	}

	@Test
	void testLoadDataSource() {
		Iterator<Account> iterator = accountRepository.findAll().iterator();
		int total = 0;
		while (iterator.hasNext()) {
			Account account = iterator.next();
			System.out.println("Account email:" + account.getIdentityValue());
			total++;
		}
		assertTrue(total >= 0);
	}

	@Test
	void testGetVideoWithEmptySSLUrl() {
		List<Video> videos = videoRepository.findVideosWithEmptySSLUrl();
		assertTrue(videos.size() >= 0);
	}

	@Test
	void testSearchVideoByCondition() {
		String countryCode = null;
		Integer[] emptyArray = new Integer[0];
		List<Video> videos = videoRepository.findVideosByCondition(countryCode, "knitting", emptyArray, 1,
				20);
		assertEquals(videos.size(), 1);
	}
}
