# Admin Security Checklist

This checklist is for administrators deploying and maintaining the Enterprise Password Manager.

## I. Initial Deployment

- [ ] **HTTPS is enforced everywhere.** The application is configured behind a reverse proxy (like Nginx or a cloud load balancer) that terminates TLS. HTTP requests are redirected to HTTPS. HSTS headers are enabled.
- [ ] **All secrets are securely managed.** No secrets are hardcoded or stored in Git. Use a secrets management tool (e.g., HashiCorp Vault, AWS Secrets Manager, Kubernetes Secrets) to inject environment variables into the running containers.
- [ ] **Secrets have been rotated.** The default secrets in `.env.example` have been replaced with strong, randomly generated values for `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, etc.
- [ ] **Database access is restricted.** The MongoDB instance is not exposed to the public internet. It should only be accessible from the application backend servers within a private network or VPC.
- [ ] **CORS policy is restrictive.** The `CORS_ORIGIN` environment variable is set to the specific domain of the frontend application, not `*`.
- [ ] **Rate limits are configured.** Review and adjust the rate-limiting settings in `packages/backend/.env` to match expected traffic patterns and security posture.
- [ ] **Secure Cookie flags are active.** Production deployment ensures the `secure` flag is set on cookies, requiring HTTPS. `httpOnly` and `sameSite='strict'` are already configured.
- [ ] **CSP headers are reviewed and hardened.** The default Content Security Policy in `helmet` is a good start, but review it to ensure it matches the specific domains and resources your application uses.

## II. Ongoing Maintenance

- [ ] **Dependencies are regularly scanned and updated.** Use `npm audit`, Snyk, or GitHub's Dependabot to monitor for vulnerabilities in third-party packages and apply patches promptly.
- [ ] **Regular backups are scheduled and tested.**
    - [ ] Database backups are performed regularly (e.g., daily).
    - [ ] Backups are encrypted at rest using a server-side key (managed by a KMS).
    - [ ] The backup restoration process is tested periodically to ensure data integrity.
- [ ] **Logs are centralized and monitored.**
    - [ ] Application logs are shipped to a central logging system (e.g., ELK stack, Datadog, Splunk).
    - [ ] Alerts are configured for security-sensitive events (e.g., high rate of failed logins, critical errors, potential attacks).
    - [ ] Logs are reviewed regularly for suspicious activity. PII is redacted.
- [ ] **Server and OS are patched.** The underlying host operating systems and container base images are regularly updated to patch security vulnerabilities.
- [ ] **Perform regular security audits.** Conduct periodic penetration tests and code reviews to identify new vulnerabilities.

## III. Incident Response

- [ ] **An incident response plan is in place.** Know who to contact and what steps to take in the event of a security breach.
- [ ] **Key rotation procedure is documented.** Have a clear process for rotating all secrets (JWT secrets, database credentials, server-side encryption keys) if a compromise is suspected.
- [ ] **Session revocation works as expected.** In case of a user reporting a compromised account, administrators have a way to revoke all active sessions for that user immediately. (The "Logout All" feature serves this purpose).

## IV. User Management & Recovery

- **Master Password Recovery**:
    - **Acknowledge the Zero-Knowledge tradeoff.** It is critical to understand and communicate to users that **if they forget their master password, their encrypted vault data is irrecoverable.**
    - **DO NOT** implement a traditional "forgot password" email link that allows resetting the master password. This would break the zero-knowledge guarantee.
- **Account Reset**:
    - An account reset process should be available. This process would verify the user's identity (e.g., via email) and then **wipe their existing encrypted vault**. The user can then set a new master password and start over. This must be clearly communicated.
- **Encourage User Backups**:
    - Educate users to use the secure "Export Vault" feature to create encrypted backups of their data, which they can store offline. This is their primary recovery mechanism.