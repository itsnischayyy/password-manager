# Threat Model

This document outlines the threat model for the Enterprise Password Manager, following the STRIDE methodology.

## 1. Spoofing

- **Threat**: An attacker impersonates a legitimate user to gain access to their vault.
- **Mitigation**:
    - Strong password policy enforced via Argon2id hashing on the server.
    - Rate limiting and account lockout mechanisms on login endpoints to prevent brute-force attacks.
    - Implementation of TOTP 2FA as an additional verification layer.
    - Secure session management with rotating refresh tokens bound to device/IP info.

- **Threat**: An attacker spoofs the server (e.g., via DNS poisoning, MITM).
- **Mitigation**:
    - Strict enforcement of HTTPS (HSTS header).
    - Certificate pinning can be implemented in client applications (browser extension, mobile app).
    - The zero-knowledge model inherently protects vault contents even if the server is spoofed, as the attacker cannot decrypt the vault without the master password.

## 2. Tampering

- **Threat**: An attacker modifies encrypted vault data in transit or at rest in the database.
- **Mitigation**:
    - **AES-256-GCM**: The GCM mode provides authenticated encryption (AEAD), which means any tampering with the ciphertext, IV, or associated data will cause decryption to fail. The authentication tag ensures integrity.
    - **HTTPS/TLS**: Protects data from tampering in transit.
    - **Database Security**: Access to the database is restricted to the backend application only, using principles of least privilege.

- **Threat**: An attacker modifies client-side JavaScript code served to the user (e.g., via XSS or a compromised CDN).
- **Mitigation**:
    - **Content Security Policy (CSP)**: A strict CSP is enforced via `helmet` to prevent loading of unauthorized scripts.
    - **Subresource Integrity (SRI)**: Can be used for any third-party scripts loaded from CDNs.
    - **Code Reviews & SAST**: Regular security code reviews and static analysis security testing (SAST) in the CI pipeline to identify vulnerabilities like XSS.

## 3. Repudiation

- **Threat**: A user (or attacker) performs a sensitive action (e.g., deleting a vault item, changing master password) and later denies it.
- **Mitigation**:
    - **Audit Logs**: The backend maintains a detailed, immutable audit log of all significant actions (login, logout, item creation/deletion, settings changes). Logs include timestamp, IP address, user agent, and action outcome.
    - **Session Management**: Logs link actions to specific sessions, which can be traced to a user's login event.

## 4. Information Disclosure

- **Threat**: An attacker gains access to the server/database and exfiltrates user data.
- **Mitigation**:
    - **Zero-Knowledge Architecture**: This is the primary defense. The most sensitive data (vault contents, TOTP secrets) is encrypted client-side with a key derived from the user's master password. The server cannot decrypt this data. An attacker stealing the database only gets encrypted blobs.
    - **Data at Rest**: While vault data is client-side encrypted, other metadata is protected by standard database security controls. Backups are encrypted using server-side keys managed by a KMS.
    - **Data in Transit**: All communication is encrypted with TLS.
    - **Error Handling**: Generic error messages are returned to clients to avoid leaking information about system state or user existence.
    - **Secret Management**: No hardcoded secrets. All application secrets are managed via environment variables and should be injected by a secrets manager (like HashiCorp Vault or AWS Secrets Manager) in production.

- **Threat**: Master password or derived keys leak from the client device (e.g., malware, browser extension vulnerability).
- **Mitigation**:
    - This is the weakest link in any zero-knowledge system. The derived Vault Key (VK) is stored only in memory for the duration of the session. It is not persisted to `localStorage` or `sessionStorage`.
    - The application prompts for the master password for highly sensitive actions (e.g., vault export, changing security settings).
    - Clipboard clearing helps mitigate shoulder-surfing or clipboard-scraping malware.
    - Users are educated on device security best practices.

## 5. Denial of Service (DoS)

- **Threat**: An attacker floods the service with requests, overwhelming resources.
- **Mitigation**:
    - **Rate Limiting**: Strict rate limiting is applied to all endpoints, especially computationally expensive ones like `/login` and `/register`. `express-rate-limit` is used.
    - **Infrastructure Scaling**: Deployed on scalable infrastructure (e.g., Kubernetes) with auto-scaling capabilities.
    - **WAF/CDN**: Using a Web Application Firewall (WAF) or a CDN like Cloudflare can help mitigate large-scale DDoS attacks.
    - **Input Validation**: All incoming data is validated to prevent attacks based on oversized or malformed payloads.

## 6. Elevation of Privilege

- **Threat**: A standard user gains administrative access.
- **Mitigation**:
    - **Principle of Least Privilege**: The application API enforces strict ownership checks. A user can only access or modify their own vault items and settings.
    - **Role-Based Access Control (RBAC)**: If an admin console is added, it will have separate, stringent authentication and authorization mechanisms. Admin actions will be heavily audited.
    - **Secure Dependencies**: Using tools like Dependabot or Snyk to regularly scan for and patch vulnerabilities in third-party libraries that could lead to privilege escalation.