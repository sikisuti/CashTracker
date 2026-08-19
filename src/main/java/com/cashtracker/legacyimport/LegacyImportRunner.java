package com.cashtracker.legacyimport;

import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

/**
 * Loads a legacy CashCounter JSON export into the app's SQLite database, replacing whatever is
 * there. Only active under the "import-legacy" profile so it never runs during normal startup.
 *
 * <p>Usage: {@code java -jar cashtracker.jar --spring.profiles.active=import-legacy
 * --legacy.import.path="C:\Apps\CashCounter\data - Copy.json"}
 */
@Component
@Profile("import-legacy")
class LegacyImportRunner implements CommandLineRunner {

    private static final String PATH_ARG_PREFIX = "--legacy.import.path=";
    private static final Logger log = LoggerFactory.getLogger(LegacyImportRunner.class);

    private final ObjectMapper objectMapper;
    private final LegacyImportService importService;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    LegacyImportRunner(ObjectMapper objectMapper, LegacyImportService importService) {
        this.objectMapper = objectMapper;
        this.importService = importService;
    }

    @Override
    public void run(String... args) throws IOException {
        String path = Arrays.stream(args)
                .filter(arg -> arg.startsWith(PATH_ARG_PREFIX))
                .map(arg -> arg.substring(PATH_ARG_PREFIX.length()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Missing " + PATH_ARG_PREFIX + "<path to legacy export json> argument"));

        backUpDatabaseFile();

        log.info("Reading legacy export from {}", path);
        LegacyExportJson export = objectMapper.readValue(new File(path), LegacyExportJson.class);

        importService.importData(export);
    }

    private void backUpDatabaseFile() throws IOException {
        Path dbPath = Path.of(datasourceUrl.replaceFirst("^jdbc:sqlite:", "").replaceFirst("\\?.*$", ""));
        if (!Files.exists(dbPath)) {
            log.info("No existing database file at {}, skipping backup", dbPath);
            return;
        }

        String timestamp = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").format(LocalDateTime.now());
        Path backupPath = dbPath.resolveSibling(dbPath.getFileName() + ".bak-" + timestamp);
        Files.copy(dbPath, backupPath);
        log.info("Backed up existing database to {}", backupPath);
    }
}
