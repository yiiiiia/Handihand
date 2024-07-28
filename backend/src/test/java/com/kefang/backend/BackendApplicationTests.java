package com.kefang.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Iterator;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.kefang.backend.db.entity.Account;
import com.kefang.backend.db.repository.AccountRepository;

@SpringBootTest
class BackendApplicationTests {

	@Autowired
	private AccountRepository accountRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void testLoadDataSource() {
		Iterator<Account> iterator = accountRepository.findAll().iterator();
		int total = 0;
		while (iterator.hasNext()) {
			Account account = iterator.next();
			System.out.println("Account email:" + account.getIdentityValue());
			total++;
		}
		assertEquals(total, 2, "expecting 2 account records");
	}
}
