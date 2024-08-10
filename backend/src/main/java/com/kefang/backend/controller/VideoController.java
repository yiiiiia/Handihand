package com.kefang.backend.controller;

import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kefang.backend.db.entity.Profile;
import com.kefang.backend.db.entity.Tag;
import com.kefang.backend.db.entity.Video;
import com.kefang.backend.db.repository.ProfileRepository;
import com.kefang.backend.db.repository.TagRepository;
import com.kefang.backend.db.repository.VideoRepository;

@RestController
public class VideoController {

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private TagRepository tagRepository;

    @GetMapping("/api/videos")
    public List<Video> getMethodName(
            @RequestParam String countryCode,
            @RequestParam String keyword,
            @RequestParam List<String> tags,
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize) {

        Integer[] tagIds = new Integer[tags.size()];
        for (int i = 0; i < tags.size(); ++i) {
            List<Tag> dbTags = tagRepository.findByWord(tags.get(i));
            if (dbTags.size() > 0) {
                tagIds[i] = (int) dbTags.get(0).getId();
            }
        }

        if (pageNumber <= 0) {
            pageNumber = 1;
        }

        List<Video> videos = videoRepository.findVideosByCondition(countryCode, keyword, tagIds, pageSize,
                pageSize * (pageNumber - 1));
        for (var video : videos) {
            List<Profile> profiles = profileRepository.findByAccountId(video.getAccountId());
            profiles.sort(new Comparator<Profile>() {
                @Override
                public int compare(Profile o1, Profile o2) {
                    return o2.getUpdatedAt().compareTo(o1.getUpdatedAt());
                }
            });
            if (profiles.size() > 0) {
                video.setProfile(profiles.get(0));
            }
        }
        return videos;
    }
}
