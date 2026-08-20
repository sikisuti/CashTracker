package com.cashtracker.dailybalance;

import com.cashtracker.correction.CorrectionDto;
import com.cashtracker.correction.CorrectionRepository;
import com.cashtracker.transaction.TransactionDto;
import com.cashtracker.transaction.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DailyBalanceService {

    private final DailyBalanceRepository repository;
    private final TransactionRepository transactionRepository;
    private final CorrectionRepository correctionRepository;

    public DailyBalanceService(DailyBalanceRepository repository, TransactionRepository transactionRepository,
            CorrectionRepository correctionRepository) {
        this.repository = repository;
        this.transactionRepository = transactionRepository;
        this.correctionRepository = correctionRepository;
    }

    /** Daily balances in the closed date range {@code [from, to]}, oldest first. */
    public List<DailyBalanceDto> findInRange(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' (" + from + ") must not be after 'to' (" + to + ")");
        }

        return repository.findByDateGreaterThanEqualAndDateLessThanOrderByDateAsc(from, to.plusDays(1)).stream()
                .map(DailyBalanceDto::from)
                .toList();
    }

    /** Everything stored about one day, or empty when no balance row exists for it. */
    @Transactional(readOnly = true)
    public Optional<DayDetailsDto> findDetails(LocalDate date) {
        return repository.findByDate(date).map(balance -> new DayDetailsDto(
                DailyBalanceDto.from(balance),
                transactionRepository.findByDailyBalanceIdOrderByTransactionDateTimeAscIdAsc(balance.getId()).stream()
                        .map(TransactionDto::from)
                        .toList(),
                correctionRepository.findByDailyBalanceIdOrderByIdAsc(balance.getId()).stream()
                        .map(CorrectionDto::from)
                        .toList()));
    }

    /** Marks a day reviewed (or not), returning empty when no balance row exists for it. */
    @Transactional
    public Optional<DailyBalanceDto> setReviewed(LocalDate date, boolean reviewed) {
        return repository.findByDate(date).map(balance -> {
            balance.setReviewed(reviewed);
            return DailyBalanceDto.from(repository.save(balance));
        });
    }
}
