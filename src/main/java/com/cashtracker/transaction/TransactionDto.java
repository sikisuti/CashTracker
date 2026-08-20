package com.cashtracker.transaction;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TransactionDto(
        Long id,
        LocalDate date,
        String type,
        LocalDateTime transactionDateTime,
        long amount,
        String accountNumber,
        String owner,
        String comment,
        String category) {

    public static TransactionDto from(Transaction transaction) {
        return new TransactionDto(
                transaction.getId(),
                transaction.getDailyBalance().getDate(),
                transaction.getType(),
                transaction.getTransactionDateTime(),
                transaction.getAmount(),
                transaction.getAccountNumber(),
                transaction.getOwner(),
                transaction.getComment(),
                transaction.getCategory() == null ? null : transaction.getCategory().getName());
    }
}
