package com.cashtracker.dailybalance;

import java.time.LocalDate;

public record DailyBalanceDto(
        LocalDate date,
        long balance,
        boolean balanceSetManually,
        boolean predicted,
        boolean reviewed) {

    static DailyBalanceDto from(DailyBalance dailyBalance) {
        return new DailyBalanceDto(
                dailyBalance.getDate(),
                dailyBalance.getBalance(),
                dailyBalance.isBalanceSetManually(),
                dailyBalance.isPredicted(),
                dailyBalance.isReviewed());
    }
}
