package com.kefang.backend.db.repository;

import org.springframework.data.repository.CrudRepository;

import com.kefang.backend.db.entity.Tag;
import java.util.List;

public interface TagRepository extends CrudRepository<Tag, Long> {

    List<Tag> findByWord(String word);
}