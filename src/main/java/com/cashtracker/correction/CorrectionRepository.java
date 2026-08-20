package com.cashtracker.correction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CorrectionRepository extends JpaRepository<Correction, Long> {

    /**
     * Corrections belonging to one day, oldest first. Keyed on the daily balance's id rather than
     * its date so the query never has to compare SQLite's text-stored date column.
     */
    List<Correction> findByDailyBalanceIdOrderByIdAsc(Long dailyBalanceId);
}
