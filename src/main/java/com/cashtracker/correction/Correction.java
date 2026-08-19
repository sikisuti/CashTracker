package com.cashtracker.correction;

import com.cashtracker.category.Category;
import com.cashtracker.dailybalance.DailyBalance;
import com.cashtracker.transaction.Transaction;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "corrections")
public class Correction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "daily_balance_id", nullable = false)
    private DailyBalance dailyBalance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String comment;

    @Column(nullable = false)
    private long amount;

    @Column(name = "only_move", nullable = false)
    private boolean onlyMove;

    @ManyToOne
    @JoinColumn(name = "paired_transaction_id")
    private Transaction pairedTransaction;

    protected Correction() {
    }

    public Correction(DailyBalance dailyBalance, Category category, String comment, long amount, boolean onlyMove,
            Transaction pairedTransaction) {
        this.dailyBalance = dailyBalance;
        this.category = category;
        this.comment = comment;
        this.amount = amount;
        this.onlyMove = onlyMove;
        this.pairedTransaction = pairedTransaction;
    }

    public Long getId() {
        return id;
    }

    public DailyBalance getDailyBalance() {
        return dailyBalance;
    }

    public Category getCategory() {
        return category;
    }

    public String getComment() {
        return comment;
    }

    public long getAmount() {
        return amount;
    }

    public boolean isOnlyMove() {
        return onlyMove;
    }

    public Transaction getPairedTransaction() {
        return pairedTransaction;
    }
}
