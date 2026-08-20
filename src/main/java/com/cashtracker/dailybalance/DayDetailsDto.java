package com.cashtracker.dailybalance;

import com.cashtracker.correction.CorrectionDto;
import com.cashtracker.transaction.TransactionDto;

import java.util.List;

/** Everything stored about one day: its balance plus the rows that make it up. */
public record DayDetailsDto(
        DailyBalanceDto balance,
        List<TransactionDto> transactions,
        List<CorrectionDto> corrections) {
}
