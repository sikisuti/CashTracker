package com.cashtracker.transaction;

import com.cashtracker.category.Category;
import com.cashtracker.dailybalance.DailyBalance;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "daily_balance_id", nullable = false)
    private DailyBalance dailyBalance;

    @Column(nullable = false)
    private String type;

    @Column(name = "transaction_datetime")
    private LocalDateTime transactionDateTime;

    @Column(nullable = false)
    private long amount;

    @Column(name = "account_number", nullable = false)
    private String accountNumber;

    @Column(nullable = false)
    private String owner;

    @Column(nullable = false)
    private String comment;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    protected Transaction() {
    }

    public Transaction(DailyBalance dailyBalance, String type, LocalDateTime transactionDateTime, long amount,
            String accountNumber, String owner, String comment, Category category) {
        this.dailyBalance = dailyBalance;
        this.type = type;
        this.transactionDateTime = transactionDateTime;
        this.amount = amount;
        this.accountNumber = accountNumber;
        this.owner = owner;
        this.comment = comment;
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public DailyBalance getDailyBalance() {
        return dailyBalance;
    }

    public String getType() {
        return type;
    }

    public LocalDateTime getTransactionDateTime() {
        return transactionDateTime;
    }

    public long getAmount() {
        return amount;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public String getOwner() {
        return owner;
    }

    public String getComment() {
        return comment;
    }

    public Category getCategory() {
        return category;
    }
}
