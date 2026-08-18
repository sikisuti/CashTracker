package com.cashtracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootApplication
public class CashTrackerApplication {

    public static void main(String[] args) {
        // SQLite's JDBC driver creates the .db file but not missing parent directories,
        // so the data directory must exist before the DataSource/Flyway initialize.
        Path dataDir = Path.of(System.getProperty("user.home"), ".cashtracker");
        try {
            Files.createDirectories(dataDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not create data directory " + dataDir, e);
        }

        SpringApplication.run(CashTrackerApplication.class, args);
    }
}
