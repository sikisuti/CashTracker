package com.cashtracker.dailybalance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "daily_balances")
public class DailyBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate date;

    @Column(nullable = false)
    private long balance;

    @Column(name = "balance_set_manually", nullable = false)
    private boolean balanceSetManually;

    @Column(nullable = false)
    private boolean predicted;

    @Column(nullable = false)
    private boolean reviewed;

    protected DailyBalance() {
    }

    public DailyBalance(LocalDate date, long balance, boolean balanceSetManually, boolean predicted, boolean reviewed) {
        this.date = date;
        this.balance = balance;
        this.balanceSetManually = balanceSetManually;
        this.predicted = predicted;
        this.reviewed = reviewed;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getDate() {
        return date;
    }

    public long getBalance() {
        return balance;
    }

    public boolean isBalanceSetManually() {
        return balanceSetManually;
    }

    public boolean isPredicted() {
        return predicted;
    }

    public boolean isReviewed() {
        return reviewed;
    }
}
