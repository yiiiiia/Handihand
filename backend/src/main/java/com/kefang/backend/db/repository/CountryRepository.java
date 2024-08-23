package com.kefang.backend.db.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.kefang.backend.db.entity.Country;

@Repository
public interface CountryRepository extends CrudRepository<Country, Long> {

}
