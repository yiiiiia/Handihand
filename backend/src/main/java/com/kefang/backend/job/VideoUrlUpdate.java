package com.kefang.backend.job;

import java.util.List;

import org.apache.logging.log4j.util.Strings;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.kefang.backend.db.entity.Video;
import com.kefang.backend.db.repository.VideoRepository;
import com.kefang.backend.transloadit.TransloaditClient;
import com.transloadit.sdk.response.AssemblyResponse;

@Component
public class VideoUrlUpdate {

    private Logger logger = LoggerFactory.getLogger(VideoUrlUpdate.class);

    @Autowired
    private VideoRepository videoRepository;

    public void updateVideoUrl() throws Exception {
        TransloaditClient transloadit = TransloaditClient.gTransloaditClient();
        List<Video> videos = videoRepository.findVideosWithEmptySSLUrl();
        for (Video video : videos) {
            if (Strings.isBlank(video.getAssemblyId())) {
                logger.error("the video uploaded has no assembly_id! video_id = {}", video.getId());
                continue;
            }
            try {
                boolean hasUpdates = false;
                AssemblyResponse assemblyResponse = transloadit.getAssembly(video.getAssemblyId());
                String videoSslUrl = assemblyResponse.getSslUrl();
                String thumbnailSslUrl = extractThubnailUrl(assemblyResponse);
                if (Strings.isBlank(videoSslUrl)) {
                    logger.warn("video ssl_url is empty from transloadit's response, assembly_id: {}",
                            video.getAssemblyId());
                } else {
                    hasUpdates = true;
                }
                if (Strings.isBlank(thumbnailSslUrl)) {
                    logger.warn("thumbnail ssl_url is empty from transloadit's response, assembly_id: {}",
                            video.getAssemblyId());
                } else {
                    hasUpdates = true;
                }
                if (hasUpdates) {
                    videoRepository.updateVideoWithSslUrl(videoSslUrl, thumbnailSslUrl, video.getId());
                }
            } catch (Exception e) {
                throw new Exception(String.format("failed to update video: %d", video.getId()), e);
            }
        }
    }

    private String extractThubnailUrl(AssemblyResponse assemblyResp) {
        String videoThumbnailStep = "video-thumbnail";
        JSONArray stepResults = assemblyResp.getStepResult(videoThumbnailStep);
        if (stepResults.length() == 0) {
            return null;
        }
        JSONObject thumbnailObj = stepResults.getJSONObject(0);
        return thumbnailObj.getString("ssl_url");
    }
}
