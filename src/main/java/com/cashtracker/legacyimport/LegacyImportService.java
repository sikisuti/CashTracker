package com.cashtracker.legacyimport;

import com.cashtracker.category.Category;
import com.cashtracker.category.CategoryMatchingRule;
import com.cashtracker.category.CategoryMatchingRuleRepository;
import com.cashtracker.category.CategoryRepository;
import com.cashtracker.correction.Correction;
import com.cashtracker.correction.CorrectionRepository;
import com.cashtracker.dailybalance.DailyBalance;
import com.cashtracker.dailybalance.DailyBalanceRepository;
import com.cashtracker.legacyimport.LegacyExportJson.CorrectionJson;
import com.cashtracker.legacyimport.LegacyExportJson.DailyBalanceJson;
import com.cashtracker.legacyimport.LegacyExportJson.MonthlyBalanceJson;
import com.cashtracker.legacyimport.LegacyExportJson.TransactionJson;
import com.cashtracker.transaction.Transaction;
import com.cashtracker.transaction.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * Loads a legacy CashCounter JSON export into the current schema. Wipes and replaces all
 * category/daily-balance/transaction/correction data, so it can be re-run against a refreshed
 * export without manual cleanup.
 */
@Service
class LegacyImportService {

    private static final Logger log = LoggerFactory.getLogger(LegacyImportService.class);

    private final CategoryRepository categoryRepository;
    private final CategoryMatchingRuleRepository categoryMatchingRuleRepository;
    private final DailyBalanceRepository dailyBalanceRepository;
    private final TransactionRepository transactionRepository;
    private final CorrectionRepository correctionRepository;

    LegacyImportService(
            CategoryRepository categoryRepository,
            CategoryMatchingRuleRepository categoryMatchingRuleRepository,
            DailyBalanceRepository dailyBalanceRepository,
            TransactionRepository transactionRepository,
            CorrectionRepository correctionRepository) {
        this.categoryRepository = categoryRepository;
        this.categoryMatchingRuleRepository = categoryMatchingRuleRepository;
        this.dailyBalanceRepository = dailyBalanceRepository;
        this.transactionRepository = transactionRepository;
        this.correctionRepository = correctionRepository;
    }

    @Transactional
    void importData(LegacyExportJson export) {
        clearExistingData();

        Map<String, Category> categoriesByName = importCategories(export);
        importMatchingRules(export, categoriesByName);

        int dayCount = 0;
        int transactionCount = 0;
        int correctionCount = 0;
        for (MonthlyBalanceJson monthlyBalance : export.monthlyBalances()) {
            for (DailyBalanceJson dayJson : monthlyBalance.dailyBalances()) {
                DayImportResult result = importDay(dayJson, categoriesByName);
                dayCount++;
                transactionCount += result.transactionCount;
                correctionCount += result.correctionCount;
            }
        }

        log.info("Imported {} categories, {} daily balances, {} transactions, {} corrections",
                categoriesByName.size(), dayCount, transactionCount, correctionCount);
    }

    private void clearExistingData() {
        correctionRepository.deleteAllInBatch();
        transactionRepository.deleteAllInBatch();
        categoryMatchingRuleRepository.deleteAllInBatch();
        dailyBalanceRepository.deleteAllInBatch();
        categoryRepository.deleteAllInBatch();
    }

    private Map<String, Category> importCategories(LegacyExportJson export) {
        Set<String> names = new LinkedHashSet<>(export.categoryMatchingRules().keySet());
        for (MonthlyBalanceJson monthlyBalance : export.monthlyBalances()) {
            for (DailyBalanceJson dayJson : monthlyBalance.dailyBalances()) {
                for (TransactionJson t : dayJson.transactions()) {
                    if (t.subCategory() != null) {
                        names.add(t.subCategory());
                    }
                }
                for (CorrectionJson c : dayJson.corrections()) {
                    names.add(c.type());
                }
            }
        }

        Map<String, Category> byName = new HashMap<>();
        for (String name : names) {
            byName.put(name, categoryRepository.save(new Category(name)));
        }
        return byName;
    }

    private void importMatchingRules(LegacyExportJson export, Map<String, Category> categoriesByName) {
        export.categoryMatchingRules().forEach((categoryName, keywords) -> {
            Category category = categoriesByName.get(categoryName);
            for (String keyword : keywords) {
                categoryMatchingRuleRepository.save(new CategoryMatchingRule(category, keyword));
            }
        });
    }

    private DayImportResult importDay(DailyBalanceJson dayJson, Map<String, Category> categoriesByName) {
        DailyBalance dailyBalance = dailyBalanceRepository.save(new DailyBalance(
                toLocalDate(dayJson.date()),
                dayJson.balance(),
                dayJson.balanceSetManually(),
                dayJson.predicted(),
                dayJson.reviewed()));

        // Verified against the source export: every non-zero pairedTransactionId resolves to a
        // transaction recorded on the *same day* as the correction. So a per-day map (source id
        // -> saved Transaction), built while importing that day's transactions and discarded once
        // its corrections are imported, is enough to resolve pairings correctly -- even though
        // source transaction ids are not globally unique (two ids repeat, on unrelated days).
        Map<Long, Transaction> transactionsBySourceId = new HashMap<>();
        for (TransactionJson t : dayJson.transactions()) {
            Category category = t.subCategory() == null ? null : categoriesByName.get(t.subCategory());
            Transaction saved = transactionRepository.save(new Transaction(
                    dailyBalance,
                    t.type(),
                    toLocalDateTime(t.transactionDateTime()),
                    t.amount(),
                    t.accountNumber(),
                    t.owner(),
                    t.comment(),
                    category));
            transactionsBySourceId.put(t.id(), saved);
        }

        for (CorrectionJson c : dayJson.corrections()) {
            Category category = categoriesByName.get(c.type());
            Transaction paired = c.pairedTransactionId() == 0 ? null : transactionsBySourceId.get(c.pairedTransactionId());
            correctionRepository.save(new Correction(
                    dailyBalance, category, c.comment(), c.amount(), c.onlyMove(), paired));
        }

        return new DayImportResult(dayJson.transactions().size(), dayJson.corrections().size());
    }

    private static LocalDate toLocalDate(int[] parts) {
        return LocalDate.of(parts[0], parts[1], parts[2]);
    }

    private static LocalDateTime toLocalDateTime(int[] parts) {
        if (parts == null) {
            return null;
        }
        int second = parts.length > 5 ? parts[5] : 0;
        return LocalDateTime.of(parts[0], parts[1], parts[2], parts[3], parts[4], second);
    }

    private record DayImportResult(int transactionCount, int correctionCount) {
    }
}
