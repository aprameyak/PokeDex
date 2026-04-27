# Security Policy

## This project is intentionally vulnerable

Pokedex Online is a deliberately insecure web application built for **security research and education**. It contains intentional flaws including (but not limited to) command injection, SQL injection, reflected XSS, unrestricted file upload, and SSRF.

**Please do not file CVEs, security advisories, or vulnerability reports for issues in this codebase.** The vulnerabilities are the point — they are teaching material, not bugs.

## Safe use

- Run only on an isolated local machine or sandboxed VM.
- Do **not** deploy this application on a public network, shared host, or any system handling real data.
- Do **not** point it at live external services you do not own or have permission to test.

## Reporting non-vulnerability issues

For bugs unrelated to the intentional vulnerabilities (e.g. crashes, broken UI, setup problems), please open a regular GitHub issue.
