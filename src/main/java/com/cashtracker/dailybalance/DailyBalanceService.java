package com.cashtracker.dailybalance;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class DailyBalanceService {

    private final DailyBalanceRepository repository;

    public DailyBalanceService(DailyBalanceRepository repository) {
        this.repository = repository;
    }

    /** Daily balances in the closed date range {@code [from, to]}, oldest first. */
    public List<DailyBalanceDto> findInRange(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' (" + from + ") must not be after 'to' (" + to + ")");
        }

        return repository.findByDateGreaterThanEqualAndDateLessThanOrderByDateAsc(from, to.plusDays(1)).stream()
                .map(DailyBalanceDto::from)
                .toList();
    }
}
