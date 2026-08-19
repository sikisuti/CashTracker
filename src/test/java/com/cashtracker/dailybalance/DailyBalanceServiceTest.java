package com.cashtracker.dailybalance;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyBalanceServiceTest {

    @Mock
    private DailyBalanceRepository repository;

    @InjectMocks
    private DailyBalanceService service;

    @Test
    void queriesWithAnExclusiveUpperBoundOneDayPastTheRequestedRange() {
        when(repository.findByDateGreaterThanEqualAndDateLessThanOrderByDateAsc(any(), any()))
                .thenReturn(List.of());

        service.findInRange(LocalDate.of(2025, 8, 1), LocalDate.of(2027, 8, 31));

        ArgumentCaptor<LocalDate> from = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<LocalDate> toExclusive = ArgumentCaptor.forClass(LocalDate.class);
        verify(repository).findByDateGreaterThanEqualAndDateLessThanOrderByDateAsc(
                from.capture(), toExclusive.capture());

        assertThat(from.getValue()).isEqualTo(LocalDate.of(2025, 8, 1));
        assertThat(toExclusive.getValue()).isEqualTo(LocalDate.of(2027, 9, 1));
    }

    @Test
    void mapsEntitiesToDtos() {
        when(repository.findByDateGreaterThanEqualAndDateLessThanOrderByDateAsc(any(), any()))
                .thenReturn(List.of(new DailyBalance(LocalDate.of(2026, 8, 19), 4818549, true, false, true)));

        assertThat(service.findInRange(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31)))
                .containsExactly(new DailyBalanceDto(LocalDate.of(2026, 8, 19), 4818549, true, false, true));
    }

    @Test
    void rejectsAnInvertedRange() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> service.findInRange(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 8, 1)));
    }
}
