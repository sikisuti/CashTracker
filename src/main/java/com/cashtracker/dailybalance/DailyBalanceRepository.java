package com.cashtracker.dailybalance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyBalanceRepository extends JpaRepository<DailyBalance, Long> {

    Optional<DailyBalance> findByDate(LocalDate date);

    /**
     * Half-open date range: {@code fromInclusive <= date < toExclusive}.
     * <p>
     * Deliberately not {@code findByDateBetween}. SQLite stores the date column as text and
     * compares it lexicographically, while the column's actual content is a full
     * "YYYY-MM-DD HH:MM:SS.fff" timestamp (see V1__create_schema.sql). A closed upper bound is
     * therefore only correct if the bound parameter happens to be rendered with the same time
     * suffix as the stored values -- a bare "YYYY-MM-DD" would sort before, and so exclude, the
     * matching row. A half-open upper bound gives the right answer under either rendering.
     */
    List<DailyBalance> findByDateGreaterThanEqualAndDateLessThanOrderByDateAsc(
            LocalDate fromInclusive, LocalDate toExclusive);
}
