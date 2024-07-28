package com.kefang.backend.db.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.kefang.backend.db.entity.Account;

@Repository
public interface AccountRepository extends CrudRepository<Account, Long> {

}
