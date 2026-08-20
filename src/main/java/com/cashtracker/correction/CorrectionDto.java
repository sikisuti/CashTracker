package com.cashtracker.correction;

/** A manual balance adjustment on one day, as shown in that day's detail view. */
public record CorrectionDto(
        Long id,
        String category,
        String comment,
        long amount,
        boolean onlyMove,
        Long pairedTransactionId) {

    public static CorrectionDto from(Correction correction) {
        return new CorrectionDto(
                correction.getId(),
                correction.getCategory().getName(),
                correction.getComment(),
                correction.getAmount(),
                correction.isOnlyMove(),
                correction.getPairedTransaction() == null ? null : correction.getPairedTransaction().getId());
    }
}
