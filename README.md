# Multi-tenant Finance Platform

## Overview
The Multi-tenant Finance Platform is a comprehensive, cloud-based SaaS web application designed to provide scalable financial management solutions for small businesses and freelancers. The platform enables users to manage multiple company accounts, track transactions, perform automated bank reconciliation, and generate financial reports within strictly isolated tenant environments.

## Core Architecture and Features
- Multi-tenant Architecture: Strict database isolation ensuring distinct data separation for individual businesses within a shared system.
- Role-Based Access Control: Tiered access level enforcement for Admin, Accountant, and Viewer roles.
- Transaction Management: Comprehensive ledger for recording, updating, tracking, and deleting internal income and expenses.
- Automated Bank Reconciliation: Direct integration with the Plaid Sandbox API for cursor-based bank feed synchronization and intelligent algorithmic auto-matching.
- Financial Reporting: High-performance Profit and Loss and Balance Sheet generation utilizing native MongoDB database aggregations.
- Compliance and Security: Append-only audit logging for system actions and CSV exports for external compliance record-keeping.

## System Requirements
- Node.js (v18 or higher recommended)
- MongoDB database instance
- Plaid Developer Account for API Sandbox access

## Setup and Installation

Clone the repository:
git clone <repository_url>

Navigate to the backend server directory:
cd server

Install backend dependencies:
npm install

Navigate to the frontend client directory:
cd ../client

Install frontend dependencies:
npm install

## Environment Configuration
Create a .env file in the server directory containing configured environment variables for PORT, MONGO_URI, JWT_SECRET, PLAID_CLIENT_ID, and PLAID_SECRET.

## Execution Commands

Start the backend server:
cd server
npm run dev

Start the frontend client:
cd client
npm run dev
