package com.cashtracker.legacyimport;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
record LegacyExportJson(List<MonthlyBalanceJson> monthlyBalances, Map<String, List<String>> categoryMatchingRules) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    record MonthlyBalanceJson(List<DailyBalanceJson> dailyBalances) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record DailyBalanceJson(
            int[] date,
            long balance,
            boolean balanceSetManually,
            boolean predicted,
            boolean reviewed,
            List<CorrectionJson> corrections,
            List<TransactionJson> transactions) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TransactionJson(
            long id,
            String type,
            int[] transactionDateTime,
            long amount,
            String accountNumber,
            String owner,
            String comment,
            String subCategory) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record CorrectionJson(
            long id,
            String type,
            String comment,
            long amount,
            boolean onlyMove,
            long pairedTransactionId) {
    }
}
