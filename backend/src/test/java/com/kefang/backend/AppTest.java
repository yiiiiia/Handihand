package com.kefang.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

import java.util.Date;
import java.util.Iterator;
import java.util.List;

import org.apache.logging.log4j.util.Strings;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.kefang.backend.db.entity.Account;
import com.kefang.backend.db.entity.Video;
import com.kefang.backend.db.repository.AccountRepository;
import com.kefang.backend.db.repository.VideoRepository;
import com.kefang.backend.job.VideoUrlUpdate;
import com.kefang.backend.transloadit.TransloaditClient;
import com.transloadit.sdk.exceptions.LocalOperationException;
import com.transloadit.sdk.exceptions.RequestException;
import com.transloadit.sdk.response.AssemblyResponse;

@SpringBootTest
class AppTest {

	private final Logger logger = LoggerFactory.getLogger(AppTest.class);

	@Autowired
	private AccountRepository accountRepository;

	@Autowired
	private VideoRepository videoRepository;

	@Autowired
	private VideoUrlUpdate videoUrlUpdate;

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
	void testTransloadit() {
		TransloaditClient transloadit = TransloaditClient.gTransloaditClient();
		try {
			AssemblyResponse assembly = transloadit.getAssembly("4a1b7f973c824cdd9c72bba8135a07e1");
			assertEquals(assembly.getId(), "4a1b7f973c824cdd9c72bba8135a07e1");
			String sslUrl = assembly.getSslUrl();
			assertTrue(Strings.isNotBlank(sslUrl));
			JSONArray thumbnailResult = assembly.getStepResult("video-thumbnail");
			assertTrue(thumbnailResult.length() > 0);
			JSONObject thumbnailStep = thumbnailResult.getJSONObject(0);
			System.out.println("Thumbnail Url: " + thumbnailStep.getString("ssl_url"));
		} catch (RequestException | LocalOperationException e) {
			fail("Unexpected exception: ", e);
		}
	}

	@Test
	void testGetVideoWithEmptySSLUrl() {
		List<Video> videos = videoRepository.findVideosWithEmptySSLUrl();
		assertTrue(videos.size() >= 0);
	}

	@Test
	void testRunVideoUpdateOnce() {
		try {
			videoUrlUpdate.updateVideoUrl();
		} catch (Exception e) {
			fail("unexpected exception: ", e);
		}
	}

	@Test
	void testSearchVideoByCondition() {
		String countryCode = null;
		List<Video> videos = videoRepository.findVideosByCondition(countryCode);
		assertEquals(videos.size(), 1);
	}
}
