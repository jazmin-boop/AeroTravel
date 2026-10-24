# Java Upgrade Summary: aero-senati

## Outcome

The Maven project now targets Java 25 and Spring Boot 3.5.16. The existing Java compile errors caused by handwritten stub `builder()` methods were fixed by removing those methods so Lombok generates the intended builders.

## Changes

- `pom.xml`: Spring Boot parent 3.4.5 → 3.5.16; `java.version` 21 → 25.
- `src/main/java/com/aerosenati/dto/ErrorResponseDTO.java`: Removed the stub builder returning `Object` and throwing `UnsupportedOperationException`.
- `src/main/java/com/aerosenati/dto/PasajeroDTO.java`: Removed the corresponding stub builder.
- `src/test/java/com/aerosenati/dto/DtoBuilderTest.java`: Added two regression tests for Lombok builders and the error response timestamp default.

## Validation

| Check | Result |
| ----- | ------ |
| Baseline on JDK 21 | Failed as expected: seven builder-chain compile errors from the two stubs; baseline tests could not start |
| JDK 25 `clean test-compile` | Passed |
| JDK 25 `clean test` | Passed; 2 tests, 0 failures/errors/skips |
| JDK 25 `clean verify` | Passed |
| Maven direct dependency resolution | Passed |
| Dedicated CVE scan | Not performed; validator was unavailable |

## Risks and Limitations

- Maven 3.9.9's Jansi and Guava emitted warnings about restricted/terminally deprecated JDK APIs under Java 25; these were non-fatal and the build passed.
- The added focused tests cover the repaired DTO builder behavior; broader application behavior is not covered. A dedicated CVE scan remains outstanding.
- Version-control operations were unavailable; no branch or commit was created. The local JDK installation resides under `.tools/jdk25`.
