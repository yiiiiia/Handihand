package com.kefang.backend.db.repository;

import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.kefang.backend.db.entity.Video;

import jakarta.transaction.Transactional;

@Repository
public interface VideoRepository extends CrudRepository<Video, Long> {
  public static final String longQuery = """
      with filtered_videos as  (
        select v.* from video v where upload_url is not null and thumbnail_url is not null and (:countryCode is null or :countryCode = country_code) and (:keyword is null or to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')) @@ plainto_tsquery(:keyword))
      ) , video_tags as (
        select vt.video_id, vt.tag_id from video_tag vt join filtered_videos fv on vt.video_id = fv.id
      ) , video_agg_tags as (
        select video_id, array_agg(tag_id) tag_ids from  video_tags group by video_id
      ), filtered_video_ids as (
        select video_id from video_agg_tags where :tagIdList ::integer[] is null or array_length(:tagIdList ::integer[], 1) = 0 or :tagIdList ::integer[] && tag_ids
      )
      select fv.* from filtered_videos fv join filtered_video_ids fvi on fv.id = fvi.video_id order by fv.created_at desc;
                              """;

  @Query(value = "select * from video where ssl_url is null order by created_at", nativeQuery = true)
  List<Video> findVideosWithEmptySSLUrl();

  @Transactional
  @Modifying
  @Query(value = "update video set ssl_url = :sslUrl, thumbnail_url = :thumbnailUrl, updated_at = now() where id = :id", nativeQuery = true)
  void updateVideoWithSslUrl(@Param(value = "sslUrl") String sslUrl,
      @Param(value = "thumbnailUrl") String thumbnailUrl, @Param(value = "id") long id);

  @Query(value = longQuery, nativeQuery = true)
  List<Video> findVideosByCondition(@Param("countryCode") String countryCode, @Param("keyword") String keyword,
      @Param("tagIdList") List<String> tagIdList);
}
