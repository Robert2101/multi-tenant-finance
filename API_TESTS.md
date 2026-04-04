# API Endpoints and Testing Guide

This document outlines all available REST API endpoints for the Multi-tenant Finance Platform and provides the necessary JSON payloads to test them.

## Overview
- Base URL: `http://localhost:5000` (or whatever your PORT is configured to)
- Required Header (for protected routes): `Authorization: Bearer <your_jwt_token>`

## Testing Tool Methods
You can easily test the entire API layer listed below using tools such as:
1. Postman Desktop
2. Insomnia REST Client
3. VS Code's "REST Client" or "Thunder Client" extensions
4. cURL via terminal

## 1. Authentication Endpoints

### Register a New User and Tenant
- **Method:** POST
- **Endpoint:** `/api/auth/register`
- **Protection:** Public
- **Raw JSON Payload:**
```json
{
  "name": "John Doe",
  "email": "admin@company.com",
  "password": "securepassword123",
  "tenantName": "Acme Corp"
}
```

### Login
- **Method:** POST
- **Endpoint:** `/api/auth/login`
- **Protection:** Public
- **Raw JSON Payload:**
```json
{
  "email": "admin@company.com",
  "password": "securepassword123",
  "tenantId": "<insert_tenant_object_id_from_db_here>"
}
```

## 2. Tenant Management Endpoints

### Get Tenant Details
- **Method:** GET
- **Endpoint:** `/api/tenant`
- **Protection:** Protected

### Update Tenant Details
- **Method:** PUT
- **Endpoint:** `/api/tenant`
- **Protection:** Protected
- **Raw JSON Payload:**
```json
{
  "name": "Acme Corporation Global",
  "domain": "acme.global"
}
```

## 3. Transaction Endpoints

### Record a New Transaction
- **Method:** POST
- **Endpoint:** `/api/transactions`
- **Protection:** Protected (Requires Admin or Accountant role)
- **Raw JSON Payload:**
```json
{
  "type": "expense",
  "amount": 150.50,
  "category": "Software",
  "description": "Monthly Cloud Hosting",
  "date": "2026-04-10T00:00:00Z"
}
```

### Retrieve All Transactions
- **Method:** GET
- **Endpoint:** `/api/transactions`
- **Protection:** Protected

### Update a Transaction
- **Method:** PUT
- **Endpoint:** `/api/transactions/:id`
- **Protection:** Protected (Requires Admin or Accountant role)
- **Raw JSON Payload:**
```json
{
  "amount": 160.00,
  "description": "Monthly Cloud Hosting - Updated"
}
```

### Delete a Transaction
- **Method:** DELETE
- **Endpoint:** `/api/transactions/:id`
- **Protection:** Protected (Requires Admin role)

## 4. Reconciliation Endpoints

### Sync Plaid Bank Feed
- **Method:** POST
- **Endpoint:** `/api/reconciliation/sync`
- **Protection:** Protected
- **Payload:** None (Requires Plaid Configuration in .env and a linked Plaid Access Token in the DB)

## 5. Financial Reporting Endpoints

### Generate Profit and Loss Report
- **Method:** GET
- **Endpoint:** `/api/reports/pnl?startDate=2026-01-01&endDate=2026-12-31`
- **Protection:** Protected

### Download Compliance P&L CSV Export
- **Method:** GET
- **Endpoint:** `/api/reports/export/csv?startDate=2026-01-01&endDate=2026-12-31`
- **Protection:** Protected

### Generate Balance Sheet Engine Ready State
- **Method:** GET
- **Endpoint:** `/api/reports/balance-sheet`
- **Protection:** Protected
