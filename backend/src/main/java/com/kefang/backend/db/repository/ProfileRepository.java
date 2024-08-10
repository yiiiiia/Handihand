package com.kefang.backend.db.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.kefang.backend.db.entity.Profile;
import java.util.List;

@Repository
public interface ProfileRepository extends CrudRepository<Profile, Long> {

    List<Profile> findByAccountId(long accountId);

}
