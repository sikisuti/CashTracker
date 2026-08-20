package com.cashtracker.dailybalance;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cashtracker.category.Category;
import com.cashtracker.correction.Correction;
import com.cashtracker.correction.CorrectionRepository;
import com.cashtracker.transaction.Transaction;
import com.cashtracker.transaction.TransactionRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyBalanceServiceTest {

    @Mock
    private DailyBalanceRepository repository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CorrectionRepository correctionRepository;

    @InjectMocks
    private DailyBalanceService service;

    private static final LocalDate DATE = LocalDate.of(2026, 8, 19);

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

    @Test
    void collectsTheTransactionsAndCorrectionsOfTheRequestedDay() {
        DailyBalance day = new DailyBalance(DATE, 4818549, false, false, false);
        when(repository.findByDate(DATE)).thenReturn(Optional.of(day));
        Category groceries = new Category("Elelmiszer");
        when(transactionRepository.findByDailyBalanceIdOrderByTransactionDateTimeAscIdAsc(day.getId()))
                .thenReturn(List.of(new Transaction(day, "kartyas vasarlas",
                        LocalDateTime.of(2026, 8, 19, 10, 30), -3200, "1234", "Bolt", "kenyer", groceries)));
        when(correctionRepository.findByDailyBalanceIdOrderByIdAsc(day.getId()))
                .thenReturn(List.of(new Correction(day, groceries, "keszpenz", -500, false, null)));

        DayDetailsDto details = service.findDetails(DATE).orElseThrow();

        assertThat(details.balance()).isEqualTo(new DailyBalanceDto(DATE, 4818549, false, false, false));
        assertThat(details.transactions()).singleElement()
                .satisfies(transaction -> {
                    assertThat(transaction.amount()).isEqualTo(-3200);
                    assertThat(transaction.category()).isEqualTo("Elelmiszer");
                });
        assertThat(details.corrections()).singleElement()
                .satisfies(correction -> {
                    assertThat(correction.amount()).isEqualTo(-500);
                    assertThat(correction.pairedTransactionId()).isNull();
                });
    }

    @Test
    void findsNoDetailsForADayWithoutAStoredBalance() {
        when(repository.findByDate(DATE)).thenReturn(Optional.empty());

        assertThat(service.findDetails(DATE)).isEmpty();
    }

    @Test
    void savesTheDayWithTheNewReviewedFlag() {
        DailyBalance day = new DailyBalance(DATE, 4818549, false, false, false);
        when(repository.findByDate(DATE)).thenReturn(Optional.of(day));
        when(repository.save(day)).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(service.setReviewed(DATE, true)).get()
                .isEqualTo(new DailyBalanceDto(DATE, 4818549, false, false, true));
        assertThat(day.isReviewed()).isTrue();
    }

    @Test
    void reviewsNothingWhenTheDayHasNoStoredBalance() {
        when(repository.findByDate(DATE)).thenReturn(Optional.empty());

        assertThat(service.setReviewed(DATE, true)).isEmpty();
        verify(repository, never()).save(any());
    }
}
