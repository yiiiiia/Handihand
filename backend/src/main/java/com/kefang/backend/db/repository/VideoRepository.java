package com.kefang.backend.db.repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.kefang.backend.db.entity.Video;

@Repository
public interface VideoRepository extends CrudRepository<Video, Long> {
  public static final String longQuery = """
      with filtered_videos as  (
        select v.* from video v where upload_url is not null and thumbnail_url is not null and (:countryCode is null or :countryCode = '' or :countryCode = country_code) and (:keyword is null or :keyword = '' or to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')) @@ plainto_tsquery(:keyword))
      ) , video_tags as (
        select fv.id as video_id, vt.tag_id from filtered_videos fv left join video_tag vt on fv.id = vt.video_id
      ) , video_agg_tags as (
        select video_id, array_agg(tag_id) tag_ids from  video_tags group by video_id
      ), filtered_video_ids as (
        select video_id from video_agg_tags where :tagIdList ::integer[] is null or array_length(:tagIdList ::integer[], 1) is null or :tagIdList ::integer[] && tag_ids
      )
      select fv.* from filtered_videos fv join filtered_video_ids fvi on fv.id = fvi.video_id order by fv.created_at desc limit :pageSize offset :skip;
                              """;

  @Query(value = longQuery, nativeQuery = true)
  List<Video> findVideosByCondition(
      @Param("countryCode") String countryCode,
      @Param("keyword") String keyword,
      @Param("tagIdList") Integer[] tagIdList,
      @Param("pageSize") Integer pageSize,
      @Param("skip") Integer skip);
}
