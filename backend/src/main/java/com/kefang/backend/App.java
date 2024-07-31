package com.kefang.backend;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.kefang.backend.job.UpdateVideoJob;

@SpringBootApplication
public class App {

	private static Logger logger = LoggerFactory.getLogger(App.class);

	public static void main(String[] args) {
		SpringApplication.run(App.class, args);
		startVideoUpdatingJob();
	}

	private static void startVideoUpdatingJob() {
		UpdateVideoJob updateVideoUrlJob = ApplicationContextHelper.getBean(UpdateVideoJob.class);
		Thread t = new Thread(updateVideoUrlJob);
		Runtime.getRuntime().addShutdownHook(new Thread() {
			@Override
			public void run() {
				logger.info("Start graceful shutdown");
				t.interrupt();
			}
		});
		t.start();
	}
}
