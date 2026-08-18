package com.cashtracker.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionDto(Long id, String description, BigDecimal amount, LocalDate date) {

    static TransactionDto from(Transaction transaction) {
        return new TransactionDto(
                transaction.getId(),
                transaction.getDescription(),
                transaction.getAmount(),
                transaction.getDate());
    }
}
