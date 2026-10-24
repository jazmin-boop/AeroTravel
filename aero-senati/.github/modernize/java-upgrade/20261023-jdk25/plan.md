# Upgrade Plan: aero-senati (20261023-jdk25)

- **Generated**: 2026-10-23 19:57 -05:00
- **HEAD Branch**: N/A (version-control status tool unavailable in this environment)
- **HEAD Commit ID**: N/A (version-control status tool unavailable in this environment)

## Available Tools

**JDKs**
- JDK 21.0.12.1: `C:\Program Files\Java\jdk-21.0.12.1` (current base JDK; baseline available)
- JDK 25: **<TO_BE_INSTALLED>** (required for upgrade build and final validation)

**Build Tools**
- Maven Wrapper 3.9.9: `.mvn/wrapper/maven-wrapper.properties` (compatible; used for all verification)

## Guidelines

- Preserve unrelated dirty changes.
- Make minimal complete fixes for existing build errors and upgrade the Java target to JDK 25.

> Note: You can add any specific guidelines or constraints for the upgrade process here if needed, bullet points are preferred.

## Options

- Working branch: N/A (version-control tool unavailable; no branch changes will be attempted)
- Run tests before and after the upgrade: true

## Upgrade Goals

- JDK 25

## Technology Stack

| Technology/Dependency | Current | Min Compatible Version | Why Incompatible |
| --------------------- | ------- | ---------------------- | ---------------- |
| Java | 21 | 25 | User requested; Java 21 compiler rejects release 25 |
| Spring Boot | 3.4.5 | 3.5.16 | Move to a maintained Spring Boot 3.5 patch line to support the requested JDK without a major Jakarta/framework migration |
| Maven Wrapper | 3.9.9 | 3.9.9 | Already compatible with JDK 25; no change needed |
| Maven compiler plugin | 3.13.0 (parent-managed) | 3.13.0 | Sufficient for JDK 25 when using a JDK 25 compiler |
| Lombok | Parent-managed | Parent-managed | Keep aligned with the Spring Boot BOM; no separate override identified |
| SpringDoc OpenAPI | 2.8.6 | 2.8.6 | No JDK target incompatibility identified |
| JJWT | 0.12.6 | 0.12.6 | No JDK target incompatibility identified |

## Derived Upgrades

- Upgrade Spring Boot from 3.4.5 to 3.5.16 to use the current stable Boot 3 line and preserve the existing Jakarta EE 10 / Spring 6 application model while targeting Java 25.
- Set the Maven `java.version` property to 25. No Kotlin sources/properties or Gradle build are present.
- Install a JDK 25 distribution for verification. Maven Wrapper 3.9.9 does not require an upgrade.

## Impact Analysis

### Dependency Changes

| File | Dependency | Current | Action | Target | Reason |
|------|------------|---------|--------|--------|--------|
| pom.xml | spring-boot-starter-parent | 3.4.5 | upgrade | 3.5.16 | Stable Boot 3 maintenance line for JDK 25 compatibility |
| pom.xml | java.version | 21 | upgrade | 25 | User target |

### Source Code Changes

| File | Location | Current | Required Change | Reason |
|------|----------|---------|-----------------|--------|
| src/main/java/com/aerosenati/dto/ErrorResponseDTO.java | builder() | Stub returns Object and throws UnsupportedOperationException, shadowing Lombok's generated builder | Remove stub method; use Lombok-generated builder | Fixes six `builder().status(...)` compile errors and a latent runtime exception |
| src/main/java/com/aerosenati/dto/PasajeroDTO.java | builder() | Stub returns Object and throws UnsupportedOperationException, shadowing Lombok's generated builder | Remove stub method; use Lombok-generated builder | Fixes chained `.id(...)` compile error and latent runtime exception |
| src/test/java/com/aerosenati/dto/DtoBuilderTest.java | New test class | No tests cover the DTO builders | Add focused tests for both generated builders and ErrorResponseDTO's default timestamp | Prevent regressions in the repaired compile/runtime behavior |

### Configuration Changes

| File | Property/Setting | Current | Required Change | Reason |
|------|------------------|---------|-----------------|--------|
| pom.xml | `java.version` | 21 | Set to 25 | User target |

### CI/CD Changes

No checked-in CI/CD files containing a Java version pin were found.

### Risks & Warnings

- JDK 25 is not installed in the initial environment. **Mitigation**: Install a JDK 25 distribution before target build/test verification; if that fails, retain code/build fixes and report the runtime validation limitation explicitly.
- Spring Boot 3.5.x Java 25 compatibility is being selected to avoid the greater migration risk of a Spring Boot 4 major upgrade; verify the actual target compiler and dependency resolution with JDK 25.

## Upgrade Steps

- Step 1: Setup Environment
  - **Rationale**: JDK 25 is required to compile and test with the target release.
  - **Changes to Make**: Install JDK 25; keep Maven Wrapper 3.9.9.
  - **Verification**: `java -version` and `.\mvnw.cmd -version` using JDK 25; both report Java 25.
- Step 2: Setup Baseline
  - **Rationale**: Record the pre-upgrade state on the currently available JDK 21.
  - **Changes to Make**: None.
  - **Verification**: `.\mvnw.cmd clean compile test-compile -q` then `.\mvnw.cmd clean test -q`; compilation is expected to expose existing stub-builder code errors.
- Step 3: Fix Existing Code and Upgrade Java Target
  - **Rationale**: Repair the discovered existing compilation failures and make runtime/build target consistent with JDK 25 on a compatible Boot 3 line.
  - **Changes to Make**: Apply Dependency Changes and Source Code Changes from Impact Analysis.
  - **Verification**: With JDK 25, `.\mvnw.cmd clean test-compile -q`.
- Step 4: CVE Validation & Fix
  - **Rationale**: Check direct dependencies after target changes.
  - **Changes to Make**: Scan direct dependencies; apply only necessary patched dependency changes.
  - **Verification**: Compile and re-scan if the CVE validation tool is available.
- Step 5: Final Validation
  - **Rationale**: Confirm upgrade and test acceptance criteria.
  - **Changes to Make**: Resolve remaining upgrade-related compile/test errors.
  - **Verification**: With JDK 25, `.\mvnw.cmd clean test-compile -q` and `.\mvnw.cmd clean test -q`.
