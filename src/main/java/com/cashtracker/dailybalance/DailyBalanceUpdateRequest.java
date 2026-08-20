package com.cashtracker.dailybalance;

/**
 * Body of {@code PATCH /api/daily-balances/{date}}. Only the reviewed flag is editable so far.
 * Boxed so an omitted field is rejected rather than silently read as {@code false}.
 */
public record DailyBalanceUpdateRequest(Boolean reviewed) {
}
