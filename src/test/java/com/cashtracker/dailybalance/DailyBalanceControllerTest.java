package com.cashtracker.dailybalance;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DailyBalanceController.class)
class DailyBalanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DailyBalanceService service;

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
}
