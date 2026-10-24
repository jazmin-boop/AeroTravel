# Upgrade Progress: aero-senati (20261023-jdk25)

- **Started**: 2026-10-23 19:57 -05:00
- **Plan Location**: `.github/modernize/java-upgrade/20261023-jdk25/plan.md`
- **Total Steps**: 5

## Step Details

- **Step 1: Setup Environment**
  - **Status**: ✅ Completed
  - **Changes Made**:
    - Installed portable Temurin JDK 25.0.4.1 under `.tools/jdk25`
    - Kept Maven Wrapper 3.9.9
  - **Review Code Changes**:
    - Sufficiency: ✅ JDK 25 available for target verification
    - Necessity: ✅ No build-tool changes were needed
      - Functional Behavior: ✅ Preserved
      - Security Controls: ✅ Preserved
  - **Verification**:
    - Command: `java -version` and `.\mvnw.cmd -version`
    - JDK: `.tools/jdk25/jdk-25.0.4.1+1`
    - Build tool: `.tools/apache-maven-3.9.9`
    - Result: ✅ Java 25.0.4.1 and Maven 3.9.9 reported
    - Notes: Machine-scope winget install failed; portable Temurin archive was downloaded from Adoptium and extracted locally.
  - **Deferred Work**: None
  - **Commit**: N/A - version-control tool unavailable

- **Step 2: Setup Baseline**
  - **Status**: ❗ Failed
  - **Changes Made**: None
  - **Review Code Changes**:
    - Sufficiency: ✅ Baseline attempted before target changes
    - Necessity: ✅ No changes
      - Functional Behavior: ✅ Preserved
      - Security Controls: ✅ Preserved
  - **Verification**:
    - Command: `.\mvnw.cmd clean compile test-compile -q`; chained `.\mvnw.cmd clean test -q` was not reached after compilation failed
    - JDK: `C:\Program Files\Java\jdk-21.0.12.1`
    - Build tool: `.tools/apache-maven-3.9.9`
    - Result: ❗ Existing compilation failures: six `ErrorResponseDTO.builder().status(...)` chains and one `PasajeroDTO.builder().id(...)` chain resolved to `Object`
    - Notes: No test source files were present; tests did not run on the broken baseline.
  - **Deferred Work**: Fix the two shadowing builder stubs in Step 3.
  - **Commit**: N/A - version-control tool unavailable

- **Step 3: Fix Existing Code and Upgrade Java Target**
  - **Status**: ✅ Completed
  - **Changes Made**:
    - Upgraded Spring Boot parent 3.4.5→3.5.16 and Java target 21→25
    - Removed the handwritten builder stub from `ErrorResponseDTO`
    - Removed the handwritten builder stub from `PasajeroDTO`
    - Added focused tests for both Lombok builders
  - **Review Code Changes**:
    - Sufficiency: ✅ Target parent/property changes and both baseline compile fixes applied
    - Necessity: ✅ Only required build and source edits retained
      - Functional Behavior: ✅ Re-enabled Lombok's intended builders; removed stub methods that threw at runtime
      - Security Controls: ✅ Preserved
  - **Verification**:
    - Command: `.\mvnw.cmd clean test-compile -q`; `.\mvnw.cmd clean test -q`
    - JDK: `.tools/jdk25/jdk-25.0.4.1+1`
    - Build tool: `.tools/apache-maven-3.9.9`
    - Result: ✅ Production and test compilation succeeded; focused tests passed 2/2
    - Notes: JDK 25 emitted Jansi/Guava restricted API warnings; no compilation errors.
  - **Deferred Work**: None
  - **Commit**: N/A - version-control tool unavailable

- **Step 4: CVE Validation & Fix**
  - **Status**: ❗ Failed
  - **Changes Made**: None
  - **Review Code Changes**:
    - Sufficiency: ⚠️ Specialized CVE scan unavailable in this tool environment; dependency resolution checked with Maven
    - Necessity: ✅ No dependency changes made without a scan finding
      - Functional Behavior: ✅ Preserved
      - Security Controls: ✅ No security configuration changed
  - **Verification**:
    - Command: `.\mvnw.cmd dependency:list -DexcludeTransitive=true -DincludeScope=compile -q`
    - JDK: `.tools/jdk25/jdk-25.0.4.1+1`
    - Build tool: `.tools/apache-maven-3.9.9`
    - Result: ✅ Direct dependency resolution succeeded; ❗ CVE status not assessed
    - Notes: Appmod CVE scanner was not exposed as an executable tool.
  - **Deferred Work**: Run a dedicated CVE scan in an environment with the validator.
  - **Commit**: N/A - version-control tool unavailable

- **Step 5: Final Validation**
  - **Status**: ✅ Completed
  - **Changes Made**: None beyond Step 3
  - **Review Code Changes**:
    - Sufficiency: ✅ Requested target, build fixes, and focused regression tests validated
    - Necessity: ✅ Only related source/config/test edits made
      - Functional Behavior: ✅ Preserved
      - Security Controls: ✅ Preserved
  - **Verification**:
    - Command: `.\mvnw.cmd clean test-compile -q`; `.\mvnw.cmd clean test -q`; `.\mvnw.cmd clean verify -q`
    - JDK: `.tools/jdk25/jdk-25.0.4.1+1`
    - Build tool: `.tools/apache-maven-3.9.9`
    - Result: ✅ All commands succeeded; 2 tests passed, 0 failures, 0 errors, 0 skipped
    - Notes: Maven/Guava emit JDK 25 restricted/terminally-deprecated API warnings. Runtime compatibility should be reviewed when upgrading these build dependencies.
  - **Deferred Work**: Run dedicated CVE scan.
  - **Commit**: N/A - version-control tool unavailable

---

## Notes

- Java 25 is confirmed as an LTS release by the OpenJDK project and the target compiles successfully with Spring Boot 3.5.16.
- The appmod event, version-control, CVE, and preview tools were unavailable in this environment; no git commands were used, and no branch or commit was created.
- The requested source/build modifications were limited to the POM, two DTOs, and focused DTO builder regression tests; generated build output and locally installed JDK files are environment artifacts.
