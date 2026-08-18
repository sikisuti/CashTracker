package com.cashtracker.transaction;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository repository;

    public TransactionService(TransactionRepository repository) {
        this.repository = repository;
    }

    public List<TransactionDto> findAll() {
        return repository.findAll().stream()
                .map(TransactionDto::from)
                .toList();
    }
}
