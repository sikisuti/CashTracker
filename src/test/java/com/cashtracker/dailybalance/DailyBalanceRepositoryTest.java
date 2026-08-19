package com.cashtracker.dailybalance;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs against a real (throwaway) SQLite file rather than an embedded database, because the
 * behaviour under test -- range comparison on a text-stored date column -- only exists on SQLite.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class DailyBalanceRepositoryTest {

    private static final Path DB_FILE = Path.of(System.getProperty("java.io.tmpdir"))
            .resolve("cashtracker-test-" + UUID.randomUUID() + ".db");

    @DynamicPropertySource
    static void useThrowawayDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + DB_FILE + "?date_class=TEXT");
    }

    @Autowired
    private DailyBalanceRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void findsDailyBalancesWithinAHalfOpenRangeIncludingBothBoundaryDays() {
        persist(LocalDate.of(2026, 7, 31));
        persist(LocalDate.of(2026, 8, 1));
        persist(LocalDate.of(2026, 8, 15));
        persist(LocalDate.of(2026, 8, 31));
        persist(LocalDate.of(2026, 9, 1));
        entityManager.flush();

        List<DailyBalance> found = repository.findByDateGreaterThanEqualAndDateLessThanOrderByDateAsc(
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 9, 1));

        assertThat(found).extracting(DailyBalance::getDate).containsExactly(
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 8, 15),
                LocalDate.of(2026, 8, 31));
    }

    @Test
    void returnsNothingWhenNoDayFallsInTheRange() {
        persist(LocalDate.of(2026, 1, 10));
        entityManager.flush();

        List<DailyBalance> found = repository.findByDateGreaterThanEqualAndDateLessThanOrderByDateAsc(
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 6, 1));

        assertThat(found).isEmpty();
    }

    @Test
    void roundTripsTheStoredDateUnchanged() {
        persist(LocalDate.of(2026, 8, 19));
        entityManager.flush();
        entityManager.clear();

        assertThat(repository.findByDate(LocalDate.of(2026, 8, 19)))
                .get()
                .extracting(DailyBalance::getDate)
                .isEqualTo(LocalDate.of(2026, 8, 19));
    }

    private void persist(LocalDate date) {
        entityManager.persist(new DailyBalance(date, 1000, false, false, false));
    }
}
