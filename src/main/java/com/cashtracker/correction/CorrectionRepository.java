package com.cashtracker.correction;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CorrectionRepository extends JpaRepository<Correction, Long> {
}
