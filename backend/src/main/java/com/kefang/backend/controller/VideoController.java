package com.kefang.backend.controller;

import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kefang.backend.db.entity.Video;
import com.kefang.backend.db.repository.VideoRepository;

@RestController
public class VideoController {

    @Autowired
    private VideoRepository videoRepository;

    private static Logger logger = LoggerFactory.getLogger(VideoController.class);

    @GetMapping("/api/videos")
    public List<Video> getMethodName(
            @RequestParam String countryCode,
            @RequestParam String keyword,
            @RequestParam List<String> tags,
            @RequestParam Integer page,
            @RequestParam Integer size) {

        logger.info("got get video request, request params are");
        logger.info("CountryCode: {}", countryCode);
        logger.info("keyword: {}", keyword);
        logger.info("tags: {}", tags);
        logger.info("page: {}", page);
        logger.info("size: {}", size);

        List<Video> videos = videoRepository.findVideosByCondition(countryCode, keyword, Collections.emptyList());
        return videos;
    }
}
