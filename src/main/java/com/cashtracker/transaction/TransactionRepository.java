package com.cashtracker.transaction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * Transactions belonging to one day, earliest first. Keyed on the daily balance's id rather
     * than its date so the query never has to compare SQLite's text-stored date column.
     * {@code transaction_datetime} is nullable; those rows sort first.
     */
    List<Transaction> findByDailyBalanceIdOrderByTransactionDateTimeAscIdAsc(Long dailyBalanceId);
}
