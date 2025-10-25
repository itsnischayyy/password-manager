# Enterprise-Grade Password Manager (MERN)

This is a production-ready, zero-knowledge password manager built on the MERN stack with TypeScript. It features client-side encryption, strong cryptographic primitives, and a secure architecture designed to protect user data at all costs.

## Features

- **Zero-Knowledge Architecture**: The server never has access to plaintext user secrets (passwords, notes, etc.). All encryption and decryption happens on the client.
- **Strong Cryptography**: Uses Argon2id for key derivation/password hashing and AES-256-GCM for symmetric encryption.
- **Secure Authentication**: Short-lived JWTs and rotating refresh tokens stored in secure, `httpOnly` cookies.
- **Two-Factor Authentication (TOTP)**: Optional time-based one-time password support.
- **Password Generator**: Secure, client-side password generator with configurable constraints.
- **Encrypted Vault Export/Import**: Users can back up and restore their data securely.
- **Production-Ready**: Includes Docker for local development and production, Kubernetes manifests for deployment, and a CI/CD pipeline with security checks.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (with Mongoose)
- **Cryptography**: Web Crypto API (frontend), Node.js `crypto` (backend)
- **Testing**: Jest & Supertest (backend), Playwright (E2E)

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (`npm install -g pnpm`)
- Docker and Docker Compose

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-name>