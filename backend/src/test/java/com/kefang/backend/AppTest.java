package com.kefang.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import com.kefang.backend.db.entity.Account;
import com.kefang.backend.db.entity.Country;
import com.kefang.backend.db.entity.Tag;
import com.kefang.backend.db.entity.Video;
import com.kefang.backend.db.repository.AccountRepository;
import com.kefang.backend.db.repository.CountryRepository;
import com.kefang.backend.db.repository.TagRepository;
import com.kefang.backend.db.repository.VideoRepository;

@SpringBootTest
public class AppTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CountryRepository countryRepository;

    @BeforeEach
    public void clearDatabase() {
        jdbcTemplate.execute("truncate table video_tag, video, profile, account restart identity cascade");
    }

    @Test
    void testCreateAccount() {
        Account acct = new Account("email", "qufei.wang2009@gmail.com", "wati_verification", new Date(), null);
        accountRepository.save(acct);
        assertTrue(acct.getId() > 0);
    }

    @Test
    void testFindAllTags() {
        Iterable<Tag> tags = tagRepository.findAll();
        final List<String> tagNames = new ArrayList<>();
        tags.forEach((var tag) -> {
            tagNames.add(tag.getWord());
        });
        assertTrue(tagNames.size() > 0, "table 'tag' not initialized");
    }

    @Test
    void testFindAllCountries() {
        Iterable<Country> countries = countryRepository.findAll();
        final List<String> countryNames = new ArrayList<>();
        countries.forEach((var country) -> countryNames.add(country.getCountryName()));
        assertTrue(countryNames.size() > 0, "table 'countries' not initialized");
    }

    @Test
    void testSearchVideoByCountry() {
        long accountId = prepareAccount();
        Video video = new Video(accountId, "GB", "Test Title", "Test Description", "test_video", "mp3", 1024,
                "https://storage.cloud.google.com/test_video.mp3",
                "https://storage.cloud.google.com/test_video_thumbnail.png", new Date(), new Date());
        video = videoRepository.save(video);
        assertTrue(video.getId() > 0, "failed to save video");
        List<Video> videos = videoRepository.findVideosByCondition("GB", "", new Integer[0], 10, 0);
        assertEquals(1, videos.size(), "expect to get only 1 video");
        assertEquals(video.getId(), videos.get(0).getId(), "not getting the expected video");
    }

    long prepareAccount() {
        Account account = new Account("email", "test123@gmail.com", "wait_verification", new Date(), null);
        account = accountRepository.save(account);
        return account.getId();
    }
}
