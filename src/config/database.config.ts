import { config as SqlConfig } from "mssql";

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  server: string;
  database: string;
  port?: number;
  username: string;
  password: string;
  connectionTimeout?: number;
  requestTimeout?: number;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
}

/**
 * Load database configuration from environment or config file
 */
export function loadDatabaseConfig(): DatabaseConfig {
  // Try to load from environment variables first
  if (process.env.SAGE_DB_SERVER) {
    return {
      server: process.env.SAGE_DB_SERVER!,
      database: process.env.SAGE_DB_NAME!,
      port: parseInt(process.env.SAGE_DB_PORT || "1433"),
      username: process.env.SAGE_DB_USERNAME!,
      password: process.env.SAGE_DB_PASSWORD!,
      connectionTimeout: parseInt(process.env.SAGE_DB_CONNECTION_TIMEOUT || "15000"),
      requestTimeout: parseInt(process.env.SAGE_DB_REQUEST_TIMEOUT || "15000"),
      encrypt: process.env.SAGE_DB_ENCRYPT === "true",
      trustServerCertificate: process.env.SAGE_DB_TRUST_CERT !== "false",
    };
  }

  // Try to load from config.json file
  try {
    const fs = require("fs");
    const configFile = require("../config.json");
    return configFile.database;
  } catch (error) {
    console.error("❌ No database configuration found!");
    console.error("\n📋 Please configure your Sage database connection:");
    console.error("Option 1: Create config.json file");
    console.error("Option 2: Set environment variables");
    console.error("\nSee README.md for details");
    process.exit(1);
  }
}

/**
 * Convert to mssql configuration format
 */
export function toMssqlConfig(dbConfig: DatabaseConfig): SqlConfig {
  return {
    server: dbConfig.server,
    database: dbConfig.database,
    port: dbConfig.port || 1433,
    user: dbConfig.username,
    password: dbConfig.password,
    connectionTimeout: dbConfig.connectionTimeout || 15000,
    requestTimeout: dbConfig.requestTimeout || 15000,
    options: {
      encrypt: dbConfig.encrypt || false,
      trustServerCertificate: dbConfig.trustServerCertificate !== false,
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(config: DatabaseConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.server) errors.push("Server is required");
  if (!config.database) errors.push("Database name is required");
  if (!config.username) errors.push("Username is required");
  if (!config.password) errors.push("Password is required");

  if (config.port && (config.port < 1 || config.port > 65535)) {
    errors.push("Port must be between 1 and 65535");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
