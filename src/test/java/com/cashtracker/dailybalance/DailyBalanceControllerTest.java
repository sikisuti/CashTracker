package com.cashtracker.dailybalance;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.cashtracker.correction.CorrectionDto;
import com.cashtracker.transaction.TransactionDto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DailyBalanceController.class)
class DailyBalanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DailyBalanceService service;

    private static final LocalDate DATE = LocalDate.of(2026, 8, 19);

    @Test
    void returnsBalancesForTheRequestedRangeWithIsoDates() throws Exception {
        when(service.findInRange(any(), any())).thenReturn(
                List.of(new DailyBalanceDto(LocalDate.of(2026, 8, 19), 4818549, false, true, false)));

        mockMvc.perform(get("/api/daily-balances").param("from", "2026-08-01").param("to", "2026-08-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].date").value("2026-08-19"))
                .andExpect(jsonPath("$[0].balance").value(4818549))
                .andExpect(jsonPath("$[0].predicted").value(true))
                .andExpect(jsonPath("$[0].reviewed").value(false));

        verify(service).findInRange(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31));
    }

    @Test
    void rejectsAnInvertedRangeWithBadRequest() throws Exception {
        when(service.findInRange(any(), any())).thenThrow(new IllegalArgumentException("inverted"));

        mockMvc.perform(get("/api/daily-balances").param("from", "2026-09-01").param("to", "2026-08-01"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsAMissingRangeParameterWithBadRequest() throws Exception {
        mockMvc.perform(get("/api/daily-balances").param("from", "2026-08-01"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnsTheTransactionsAndCorrectionsOfOneDay() throws Exception {
        when(service.findDetails(DATE)).thenReturn(Optional.of(new DayDetailsDto(
                new DailyBalanceDto(DATE, 4818549, false, false, true),
                List.of(new TransactionDto(7L, DATE, "kartyas vasarlas",
                        LocalDateTime.of(2026, 8, 19, 10, 30), -3200, "1234", "Bolt", "kenyer", "Elelmiszer")),
                List.of(new CorrectionDto(3L, "Elelmiszer", "keszpenz", -500, false, null)))));

        mockMvc.perform(get("/api/daily-balances/2026-08-19"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance.balance").value(4818549))
                .andExpect(jsonPath("$.balance.reviewed").value(true))
                .andExpect(jsonPath("$.transactions[0].amount").value(-3200))
                .andExpect(jsonPath("$.transactions[0].category").value("Elelmiszer"))
                .andExpect(jsonPath("$.corrections[0].amount").value(-500));
    }

    @Test
    void reportsNotFoundForADayWithoutAStoredBalance() throws Exception {
        when(service.findDetails(DATE)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/daily-balances/2026-08-19"))
                .andExpect(status().isNotFound());
    }

    @Test
    void marksADayReviewed() throws Exception {
        when(service.setReviewed(DATE, true))
                .thenReturn(Optional.of(new DailyBalanceDto(DATE, 4818549, false, false, true)));

        mockMvc.perform(patch("/api/daily-balances/2026-08-19")
                        .contentType(APPLICATION_JSON)
                        .content("{\"reviewed\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewed").value(true));

        verify(service).setReviewed(DATE, true);
    }

    @Test
    void reportsNotFoundWhenReviewingADayWithoutAStoredBalance() throws Exception {
        when(service.setReviewed(DATE, false)).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/daily-balances/2026-08-19")
                        .contentType(APPLICATION_JSON)
                        .content("{\"reviewed\":false}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsAPatchWithoutTheReviewedFlagAsBadRequest() throws Exception {
        mockMvc.perform(patch("/api/daily-balances/2026-08-19")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
