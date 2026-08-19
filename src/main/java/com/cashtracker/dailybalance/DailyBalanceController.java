package com.cashtracker.dailybalance;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/daily-balances")
public class DailyBalanceController {

    private final DailyBalanceService service;

    public DailyBalanceController(DailyBalanceService service) {
        this.service = service;
    }

    /**
     * Daily balances between {@code from} and {@code to}, both inclusive, both ISO "YYYY-MM-DD".
     * Days with no stored balance are simply absent from the response.
     */
    @GetMapping
    public List<DailyBalanceDto> getInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.findInRange(from, to);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleInvalidRange(IllegalArgumentException exception) {
        return exception.getMessage();
    }
}
