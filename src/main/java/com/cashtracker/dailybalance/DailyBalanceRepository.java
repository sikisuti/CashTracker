package com.cashtracker.dailybalance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DailyBalanceRepository extends JpaRepository<DailyBalance, Long> {

    Optional<DailyBalance> findByDate(LocalDate date);
}
