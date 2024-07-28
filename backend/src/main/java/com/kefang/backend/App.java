package com.kefang.backend;

import javax.sql.DataSource;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class App {

	@Bean
	DataSource getDataSource() {
		DataSourceBuilder<?> dataSourceBuilder = DataSourceBuilder.create();
		dataSourceBuilder.driverClassName("org.postgresql.Driver");
		dataSourceBuilder.url("jdbc:postgresql://localhost:8888/handihand_dev?sslmode=disable");
		dataSourceBuilder.username("postgres");
		dataSourceBuilder.password("postgres");
		return dataSourceBuilder.build();
	}

	public static void main(String[] args) {
		SpringApplication.run(App.class, args);
	}

}
