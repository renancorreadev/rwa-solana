import { Pool, QueryResult } from 'pg';
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { Logger } from '../../shared/utils/Logger';

@injectable()
export class PostgresDatabase {
  private pool: Pool;
  private initialized: boolean = false;

  constructor(@inject(TOKENS.Logger) private logger: Logger) {
    const connectionString = process.env.DATABASE_URL ||
      'postgres://postgres:postgres@localhost:5432/hub_indexer';

    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', err);
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Test connection
      const client = await this.pool.connect();
      this.logger.info('PostgreSQL connected successfully');
      client.release();

      // Create tables if not exist
      await this.createTables();
      this.initialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const createUserPreferencesTable = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(44) UNIQUE NOT NULL,
        theme VARCHAR(20) DEFAULT 'system',
        currency VARCHAR(10) DEFAULT 'USD',
        hide_balances BOOLEAN DEFAULT false,
        notifications JSONB DEFAULT '{"revenueAlerts":true,"priceAlerts":true,"newProperties":true,"kycReminders":true,"marketingEmails":false}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    const createUserActivitiesTable = `
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(44) NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        property_mint VARCHAR(44),
        property_name VARCHAR(255),
        amount DECIMAL(20, 2),
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_user_activities_wallet ON user_activities(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at DESC);
    `;

    const createPortfolioSnapshotsTable = `
      CREATE TABLE IF NOT EXISTS portfolio_snapshots (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(44) NOT NULL,
        total_value_usd DECIMAL(20, 2),
        total_properties INTEGER,
        holdings JSONB,
        snapshot_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(wallet_address, snapshot_date)
      );

      CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_wallet ON portfolio_snapshots(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date DESC);
    `;

    // Dividend calendar tables
    const createScheduledDistributionsTable = `
      CREATE TABLE IF NOT EXISTS scheduled_distributions (
        id SERIAL PRIMARY KEY,
        property_mint VARCHAR(50) NOT NULL,
        property_name VARCHAR(100),
        scheduled_date DATE NOT NULL,
        estimated_amount_sol DECIMAL(20,9),
        estimated_amount_brl DECIMAL(20,2),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'scheduled',
        actual_epoch_number INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sched_date ON scheduled_distributions(scheduled_date);
      CREATE INDEX IF NOT EXISTS idx_sched_property ON scheduled_distributions(property_mint);
    `;

    const createClaimHistoryCacheTable = `
      CREATE TABLE IF NOT EXISTS claim_history_cache (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(50) NOT NULL,
        property_mint VARCHAR(50) NOT NULL,
        property_name VARCHAR(100),
        epoch_number INTEGER NOT NULL,
        amount_sol DECIMAL(20,9) NOT NULL,
        amount_brl DECIMAL(20,2),
        token_balance_at_claim DECIMAL(20,6),
        percentage_of_property DECIMAL(10,6),
        claimed_at TIMESTAMP NOT NULL,
        tx_signature VARCHAR(100),
        synced_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(wallet_address, property_mint, epoch_number)
      );

      CREATE INDEX IF NOT EXISTS idx_claim_wallet ON claim_history_cache(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_claim_date ON claim_history_cache(claimed_at DESC);
    `;

    const createRevenueProjectionsTable = `
      CREATE TABLE IF NOT EXISTS revenue_projections (
        id SERIAL PRIMARY KEY,
        property_mint VARCHAR(50) NOT NULL,
        month DATE NOT NULL,
        projected_revenue_sol DECIMAL(20,9),
        projected_revenue_brl DECIMAL(20,2),
        source VARCHAR(50) DEFAULT 'rental',
        notes TEXT,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(property_mint, month)
      );

      CREATE INDEX IF NOT EXISTS idx_rev_proj_property ON revenue_projections(property_mint);
      CREATE INDEX IF NOT EXISTS idx_rev_proj_month ON revenue_projections(month);
    `;

    try {
      await this.query(createUserPreferencesTable);
      await this.query(createUserActivitiesTable);
      await this.query(createPortfolioSnapshotsTable);
      await this.query(createScheduledDistributionsTable);
      await this.query(createClaimHistoryCacheTable);
      await this.query(createRevenueProjectionsTable);
      this.logger.info('Database tables created/verified successfully');
    } catch (error) {
      this.logger.error('Failed to create tables', error);
      throw error;
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      this.logger.debug(`Query executed in ${duration}ms`, { text: text.substring(0, 100), rows: result.rowCount });
      return result;
    } catch (error) {
      this.logger.error('Query failed', { text: text.substring(0, 100), error });
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info('PostgreSQL connection closed');
  }

  isConnected(): boolean {
    return this.initialized;
  }
}
