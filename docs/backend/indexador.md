# Indexador

## Visão Geral

O Indexador é um serviço escrito em Go responsável por sincronizar dados da blockchain Solana com o banco de dados PostgreSQL. Ele monitora transações do Hub Token Program e processa eventos em tempo real.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         INDEXADOR (GO)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │Scheduler │───▶│  Syncer  │───▶│ Decoder  │───▶│Processor │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │         │
│       │               ▼               ▼               ▼         │
│       │         ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│       │         │Solana RPC│   │   IDL    │   │PostgreSQL│     │
│       │         └──────────┘   └──────────┘   └──────────┘     │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────┐                                                   │
│  │ HTTP API │◀── Endpoints REST                                │
│  └──────────┘                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estrutura do Projeto

```
services/indexer/
├── cmd/
│   └── main.go                 # Entry point
├── internal/
│   ├── config/
│   │   └── config.go           # Configurações
│   ├── database/
│   │   ├── database.go         # Conexão DB
│   │   ├── queries.go          # SQL queries
│   │   └── migrations/
│   │       ├── 001_initial.up.sql
│   │       └── 001_initial.down.sql
│   ├── indexer/
│   │   ├── indexer.go          # Loop principal
│   │   ├── syncer.go           # Busca transações
│   │   ├── decoder.go          # Decodifica instruções
│   │   └── processor.go        # Processa eventos
│   ├── api/
│   │   ├── server.go           # HTTP server
│   │   ├── handlers.go         # Request handlers
│   │   └── routes.go           # Rotas
│   └── models/
│       ├── property.go
│       ├── investor.go
│       ├── transaction.go
│       └── revenue.go
├── pkg/
│   └── solana/
│       └── client.go           # Solana RPC client
├── go.mod
├── go.sum
└── Dockerfile
```

---

## Configuração

### internal/config/config.go

```go
package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	// Server
	Port string
	Host string

	// Database
	DatabaseURL string

	// Solana
	SolanaRPCURL   string
	SolanaProgramID string

	// Indexer
	IndexerInterval time.Duration
	BatchSize       int

	// Logging
	LogLevel string
}

func Load() *Config {
	return &Config{
		Port: getEnv("PORT", "9090"),
		Host: getEnv("HOST", "0.0.0.0"),

		DatabaseURL: mustGetEnv("DATABASE_URL"),

		SolanaRPCURL:    mustGetEnv("SOLANA_RPC_URL"),
		SolanaProgramID: mustGetEnv("SOLANA_PROGRAM_ID"),

		IndexerInterval: parseDuration(getEnv("INDEXER_INTERVAL", "60s")),
		BatchSize:       parseInt(getEnv("INDEXER_BATCH_SIZE", "100")),

		LogLevel: getEnv("LOG_LEVEL", "info"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func mustGetEnv(key string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	panic("Missing required env var: " + key)
}

func parseDuration(s string) time.Duration {
	d, _ := time.ParseDuration(s)
	return d
}

func parseInt(s string) int {
	i, _ := strconv.Atoi(s)
	return i
}
```

---

## Entry Point

### cmd/main.go

```go
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"hub-indexer/internal/api"
	"hub-indexer/internal/config"
	"hub-indexer/internal/database"
	"hub-indexer/internal/indexer"
	"hub-indexer/pkg/solana"
)

func main() {
	// Carregar configuração
	cfg := config.Load()

	// Conectar banco de dados
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Rodar migrações
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Criar cliente Solana
	solanaClient := solana.NewClient(cfg.SolanaRPCURL)

	// Criar indexador
	idx := indexer.New(indexer.Config{
		DB:            db,
		SolanaClient:  solanaClient,
		ProgramID:     cfg.SolanaProgramID,
		Interval:      cfg.IndexerInterval,
		BatchSize:     cfg.BatchSize,
	})

	// Iniciar indexador em goroutine
	ctx, cancel := context.WithCancel(context.Background())
	go idx.Start(ctx)

	// Criar servidor HTTP
	server := api.NewServer(db, solanaClient)
	httpServer := &http.Server{
		Addr:    cfg.Host + ":" + cfg.Port,
		Handler: server.Router(),
	}

	// Iniciar servidor HTTP
	go func() {
		log.Printf("API server listening on %s:%s", cfg.Host, cfg.Port)
		if err := httpServer.ListenAndServe(); err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	// Aguardar sinal de shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down...")

	// Graceful shutdown
	cancel() // Parar indexador

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Printf("HTTP server shutdown error: %v", err)
	}

	log.Println("Shutdown complete")
}
```

---

## Indexador Principal

### internal/indexer/indexer.go

```go
package indexer

import (
	"context"
	"database/sql"
	"log"
	"time"

	"hub-indexer/pkg/solana"
)

type Config struct {
	DB           *sql.DB
	SolanaClient *solana.Client
	ProgramID    string
	Interval     time.Duration
	BatchSize    int
}

type Indexer struct {
	config    Config
	syncer    *Syncer
	decoder   *Decoder
	processor *Processor
	lastSlot  uint64
}

func New(cfg Config) *Indexer {
	return &Indexer{
		config:    cfg,
		syncer:    NewSyncer(cfg.SolanaClient, cfg.ProgramID),
		decoder:   NewDecoder(),
		processor: NewProcessor(cfg.DB),
	}
}

func (i *Indexer) Start(ctx context.Context) {
	log.Printf("Starting indexer with interval %s", i.config.Interval)

	// Carregar último slot processado
	i.loadLastSlot()

	ticker := time.NewTicker(i.config.Interval)
	defer ticker.Stop()

	// Sync imediato na inicialização
	i.sync(ctx)

	for {
		select {
		case <-ctx.Done():
			log.Println("Indexer stopped")
			return
		case <-ticker.C:
			i.sync(ctx)
		}
	}
}

func (i *Indexer) sync(ctx context.Context) {
	log.Printf("Starting sync from slot %d", i.lastSlot)

	// Buscar novas transações
	signatures, err := i.syncer.GetNewSignatures(ctx, i.lastSlot, i.config.BatchSize)
	if err != nil {
		log.Printf("Error fetching signatures: %v", err)
		return
	}

	if len(signatures) == 0 {
		log.Println("No new transactions")
		return
	}

	log.Printf("Found %d new transactions", len(signatures))

	// Processar cada transação
	for _, sig := range signatures {
		tx, err := i.syncer.GetTransaction(ctx, sig.Signature)
		if err != nil {
			log.Printf("Error fetching transaction %s: %v", sig.Signature, err)
			continue
		}

		// Decodificar instrução
		instruction, err := i.decoder.Decode(tx)
		if err != nil {
			log.Printf("Error decoding transaction %s: %v", sig.Signature, err)
			continue
		}

		if instruction == nil {
			continue // Não é uma instrução do nosso programa
		}

		// Processar instrução
		if err := i.processor.Process(ctx, instruction, tx); err != nil {
			log.Printf("Error processing transaction %s: %v", sig.Signature, err)
			continue
		}

		// Atualizar último slot
		if sig.Slot > i.lastSlot {
			i.lastSlot = sig.Slot
			i.saveLastSlot()
		}
	}

	log.Printf("Sync complete. New last slot: %d", i.lastSlot)
}

func (i *Indexer) loadLastSlot() {
	row := i.config.DB.QueryRow("SELECT last_slot FROM sync_state WHERE id = 1")
	row.Scan(&i.lastSlot)
}

func (i *Indexer) saveLastSlot() {
	_, err := i.config.DB.Exec(`
		INSERT INTO sync_state (id, last_slot, updated_at)
		VALUES (1, $1, NOW())
		ON CONFLICT (id) DO UPDATE SET last_slot = $1, updated_at = NOW()
	`, i.lastSlot)
	if err != nil {
		log.Printf("Error saving last slot: %v", err)
	}
}
```

---

## Syncer

### internal/indexer/syncer.go

```go
package indexer

import (
	"context"

	"hub-indexer/pkg/solana"
)

type SignatureInfo struct {
	Signature string
	Slot      uint64
	BlockTime int64
}

type Syncer struct {
	client    *solana.Client
	programID string
}

func NewSyncer(client *solana.Client, programID string) *Syncer {
	return &Syncer{
		client:    client,
		programID: programID,
	}
}

func (s *Syncer) GetNewSignatures(ctx context.Context, afterSlot uint64, limit int) ([]SignatureInfo, error) {
	// Buscar assinaturas para o programa
	sigs, err := s.client.GetSignaturesForAddress(ctx, s.programID, limit, afterSlot)
	if err != nil {
		return nil, err
	}

	result := make([]SignatureInfo, len(sigs))
	for i, sig := range sigs {
		result[i] = SignatureInfo{
			Signature: sig.Signature,
			Slot:      sig.Slot,
			BlockTime: sig.BlockTime,
		}
	}

	return result, nil
}

func (s *Syncer) GetTransaction(ctx context.Context, signature string) (*solana.Transaction, error) {
	return s.client.GetTransaction(ctx, signature)
}
```

---

## Decoder

### internal/indexer/decoder.go

```go
package indexer

import (
	"encoding/binary"
	"errors"

	"hub-indexer/pkg/solana"
)

// Discriminadores das instruções (primeiros 8 bytes do SHA256 do nome)
var (
	DiscriminatorInitialize      = []byte{175, 175, 109, 31, 13, 152, 155, 237}
	DiscriminatorInvest          = []byte{13, 245, 180, 103, 254, 182, 121, 4}
	DiscriminatorDepositRevenue  = []byte{150, 94, 182, 111, 50, 168, 69, 27}
	DiscriminatorClaim           = []byte{62, 198, 214, 193, 213, 159, 108, 210}
	DiscriminatorReleaseEscrow   = []byte{134, 229, 26, 108, 181, 146, 58, 231}
	DiscriminatorTransferHook    = []byte{105, 37, 101, 197, 75, 251, 102, 26}
)

type InstructionType int

const (
	InstructionUnknown InstructionType = iota
	InstructionInitialize
	InstructionInvest
	InstructionDepositRevenue
	InstructionClaim
	InstructionReleaseEscrow
	InstructionTransferHook
)

type DecodedInstruction struct {
	Type      InstructionType
	Accounts  []string
	Data      interface{}
	Signature string
	Slot      uint64
	BlockTime int64
}

type Decoder struct{}

func NewDecoder() *Decoder {
	return &Decoder{}
}

func (d *Decoder) Decode(tx *solana.Transaction) (*DecodedInstruction, error) {
	if tx == nil || len(tx.Instructions) == 0 {
		return nil, nil
	}

	// Procurar instrução do nosso programa
	for _, ix := range tx.Instructions {
		if !ix.IsProgramInstruction {
			continue
		}

		instruction, err := d.decodeInstruction(ix, tx)
		if err != nil {
			continue
		}

		if instruction != nil {
			instruction.Signature = tx.Signature
			instruction.Slot = tx.Slot
			instruction.BlockTime = tx.BlockTime
			return instruction, nil
		}
	}

	return nil, nil
}

func (d *Decoder) decodeInstruction(ix solana.Instruction, tx *solana.Transaction) (*DecodedInstruction, error) {
	if len(ix.Data) < 8 {
		return nil, errors.New("instruction data too short")
	}

	discriminator := ix.Data[:8]
	data := ix.Data[8:]

	instruction := &DecodedInstruction{
		Accounts: ix.Accounts,
	}

	switch {
	case matchDiscriminator(discriminator, DiscriminatorInitialize):
		instruction.Type = InstructionInitialize
		instruction.Data = d.decodeInitialize(data)

	case matchDiscriminator(discriminator, DiscriminatorInvest):
		instruction.Type = InstructionInvest
		instruction.Data = d.decodeInvest(data)

	case matchDiscriminator(discriminator, DiscriminatorDepositRevenue):
		instruction.Type = InstructionDepositRevenue
		instruction.Data = d.decodeDepositRevenue(data)

	case matchDiscriminator(discriminator, DiscriminatorClaim):
		instruction.Type = InstructionClaim
		instruction.Data = d.decodeClaim(data)

	case matchDiscriminator(discriminator, DiscriminatorReleaseEscrow):
		instruction.Type = InstructionReleaseEscrow

	case matchDiscriminator(discriminator, DiscriminatorTransferHook):
		instruction.Type = InstructionTransferHook
		instruction.Data = d.decodeTransferHook(data)

	default:
		return nil, nil // Instrução desconhecida
	}

	return instruction, nil
}

func matchDiscriminator(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// Estruturas de dados das instruções

type InitializeData struct {
	Name            string
	Symbol          string
	Decimals        uint8
	TotalSupply     uint64
	PropertyAddress string
	PropertyType    string
	TotalValueUsd   uint64
	RentalYieldBps  uint16
	MetadataUri     string
}

type InvestData struct {
	Amount uint64
}

type DepositRevenueData struct {
	Epoch  uint32
	Amount uint64
}

type ClaimData struct {
	Epoch uint32
}

type TransferHookData struct {
	Amount uint64
}

func (d *Decoder) decodeInitialize(data []byte) *InitializeData {
	// Decodificação Borsh
	// ... implementação detalhada
	return &InitializeData{}
}

func (d *Decoder) decodeInvest(data []byte) *InvestData {
	if len(data) < 8 {
		return nil
	}
	return &InvestData{
		Amount: binary.LittleEndian.Uint64(data[:8]),
	}
}

func (d *Decoder) decodeDepositRevenue(data []byte) *DepositRevenueData {
	if len(data) < 12 {
		return nil
	}
	return &DepositRevenueData{
		Epoch:  binary.LittleEndian.Uint32(data[:4]),
		Amount: binary.LittleEndian.Uint64(data[4:12]),
	}
}

func (d *Decoder) decodeClaim(data []byte) *ClaimData {
	if len(data) < 4 {
		return nil
	}
	return &ClaimData{
		Epoch: binary.LittleEndian.Uint32(data[:4]),
	}
}

func (d *Decoder) decodeTransferHook(data []byte) *TransferHookData {
	if len(data) < 8 {
		return nil
	}
	return &TransferHookData{
		Amount: binary.LittleEndian.Uint64(data[:8]),
	}
}
```

---

## Processor

### internal/indexer/processor.go

```go
package indexer

import (
	"context"
	"database/sql"
	"log"
	"time"

	"hub-indexer/pkg/solana"
)

type Processor struct {
	db *sql.DB
}

func NewProcessor(db *sql.DB) *Processor {
	return &Processor{db: db}
}

func (p *Processor) Process(ctx context.Context, ix *DecodedInstruction, tx *solana.Transaction) error {
	switch ix.Type {
	case InstructionInitialize:
		return p.processInitialize(ctx, ix, tx)
	case InstructionInvest:
		return p.processInvest(ctx, ix, tx)
	case InstructionDepositRevenue:
		return p.processDepositRevenue(ctx, ix, tx)
	case InstructionClaim:
		return p.processClaim(ctx, ix, tx)
	case InstructionReleaseEscrow:
		return p.processReleaseEscrow(ctx, ix, tx)
	case InstructionTransferHook:
		return p.processTransferHook(ctx, ix, tx)
	default:
		return nil
	}
}

func (p *Processor) processInitialize(ctx context.Context, ix *DecodedInstruction, tx *solana.Transaction) error {
	data := ix.Data.(*InitializeData)

	// Accounts: [authority, mint, propertyState, ...]
	if len(ix.Accounts) < 3 {
		return nil
	}

	authority := ix.Accounts[0]
	mint := ix.Accounts[1]
	propertyStatePda := ix.Accounts[2]

	_, err := p.db.ExecContext(ctx, `
		INSERT INTO properties (
			mint, property_state_pda, authority, seller_wallet,
			status, total_supply, circulating_supply, decimals,
			property_address, property_type, total_value_usd,
			rental_yield_bps, metadata_uri, current_epoch,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)
		ON CONFLICT (mint) DO NOTHING
	`,
		mint, propertyStatePda, authority, authority, // seller = authority por padrão
		1, // active
		data.TotalSupply, 0, data.Decimals,
		data.PropertyAddress, data.PropertyType, data.TotalValueUsd,
		data.RentalYieldBps, data.MetadataUri, 0,
		time.Unix(ix.BlockTime, 0),
	)

	if err != nil {
		return err
	}

	// Registrar transação
	return p.saveTransaction(ctx, ix, tx, "initialize", mint, authority, "", data.TotalSupply)
}

func (p *Processor) processInvest(ctx context.Context, ix *DecodedInstruction, tx *solana.Transaction) error {
	data := ix.Data.(*InvestData)

	// Accounts: [investor, mint, propertyState, investorTokenAccount, ...]
	if len(ix.Accounts) < 4 {
		return nil
	}

	investor := ix.Accounts[0]
	mint := ix.Accounts[1]
	tokenAccount := ix.Accounts[3]

	// Atualizar circulating_supply da propriedade
	// (Nota: idealmente, buscaríamos o estado on-chain para obter valores exatos)
	_, err := p.db.ExecContext(ctx, `
		UPDATE properties
		SET circulating_supply = circulating_supply + $1, updated_at = NOW()
		WHERE mint = $2
	`, data.Amount, mint)

	if err != nil {
		log.Printf("Error updating property supply: %v", err)
	}

	// Upsert investidor
	_, err = p.db.ExecContext(ctx, `
		INSERT INTO investors (wallet, mint, token_account, balance, last_claimed_epoch, first_investment_at, last_activity_at)
		VALUES ($1, $2, $3, $4, 0, NOW(), NOW())
		ON CONFLICT (wallet, mint) DO UPDATE SET
			balance = investors.balance + $4,
			last_activity_at = NOW()
	`, investor, mint, tokenAccount, data.Amount)

	if err != nil {
		log.Printf("Error upserting investor: %v", err)
	}

	// Registrar transação
	return p.saveTransaction(ctx, ix, tx, "invest", mint, investor, "", data.Amount)
}

func (p *Processor) processDepositRevenue(ctx context.Context, ix *DecodedInstruction, tx *solana.Transaction) error {
	data := ix.Data.(*DepositRevenueData)

	// Accounts: [authority, mint, propertyState, ...]
	if len(ix.Accounts) < 3 {
		return nil
	}

	mint := ix.Accounts[1]

	// Buscar total_supply atual
	var totalSupply uint64
	err := p.db.QueryRowContext(ctx, "SELECT total_supply FROM properties WHERE mint = $1", mint).Scan(&totalSupply)
	if err != nil {
		return err
	}

	// Inserir registro de receita
	_, err = p.db.ExecContext(ctx, `
		INSERT INTO revenue_epochs (mint, epoch, amount, total_supply_at_epoch, deposited_at, tx_signature)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (mint, epoch) DO NOTHING
	`, mint, data.Epoch, data.Amount, totalSupply, time.Unix(ix.BlockTime, 0), ix.Signature)

	if err != nil {
		return err
	}

	// Atualizar current_epoch da propriedade
	_, err = p.db.ExecContext(ctx, `
		UPDATE properties SET current_epoch = $1, updated_at = NOW() WHERE mint = $2
	`, data.Epoch, mint)

	return err
}

func (p *Processor) processClaim(ctx context.Context, ix *DecodedInstruction, tx *solana.Transaction) error {
	data := ix.Data.(*ClaimData)

	// Accounts: [investor, mint, ...]
	if len(ix.Accounts) < 2 {
		return nil
	}

	investor := ix.Accounts[0]
	mint := ix.Accounts[1]

	// Atualizar last_claimed_epoch do investidor
	_, err := p.db.ExecContext(ctx, `
		UPDATE investors SET last_claimed_epoch = $1, last_activity_at = NOW()
		WHERE wallet = $2 AND mint = $3
	`, data.Epoch, investor, mint)

	if err != nil {
		return err
	}

	// Registrar transação
	return p.saveTransaction(ctx, ix, tx, "claim", mint, investor, "", 0)
}

func (p *Processor) processReleaseEscrow(ctx context.Context, ix *DecodedInstruction, tx *solana.Transaction) error {
	// Accounts: [authority, mint, escrowPda, sellerWallet, ...]
	if len(ix.Accounts) < 4 {
		return nil
	}

	mint := ix.Accounts[1]
	seller := ix.Accounts[3]

	// Registrar transação
	return p.saveTransaction(ctx, ix, tx, "release_escrow", mint, "", seller, 0)
}

func (p *Processor) processTransferHook(ctx context.Context, ix *DecodedInstruction, tx *solana.Transaction) error {
	data := ix.Data.(*TransferHookData)

	// Accounts: [source, mint, destination, sourceAuthority, ...]
	if len(ix.Accounts) < 4 {
		return nil
	}

	mint := ix.Accounts[1]
	from := ix.Accounts[3] // sourceAuthority = sender wallet

	// Registrar transação
	return p.saveTransaction(ctx, ix, tx, "transfer", mint, from, "", data.Amount)
}

func (p *Processor) saveTransaction(
	ctx context.Context,
	ix *DecodedInstruction,
	tx *solana.Transaction,
	txType, mint, fromWallet, toWallet string,
	amount uint64,
) error {
	_, err := p.db.ExecContext(ctx, `
		INSERT INTO transactions (signature, block_time, slot, tx_type, mint, from_wallet, to_wallet, amount, success, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (signature) DO NOTHING
	`,
		ix.Signature, ix.BlockTime, ix.Slot, txType, mint, fromWallet, toWallet, amount, true,
		time.Unix(ix.BlockTime, 0),
	)
	return err
}
```

---

## API HTTP

### internal/api/server.go

```go
package api

import (
	"database/sql"
	"net/http"

	"github.com/gorilla/mux"
	"hub-indexer/pkg/solana"
)

type Server struct {
	db           *sql.DB
	solanaClient *solana.Client
	router       *mux.Router
}

func NewServer(db *sql.DB, solanaClient *solana.Client) *Server {
	s := &Server{
		db:           db,
		solanaClient: solanaClient,
		router:       mux.NewRouter(),
	}

	s.setupRoutes()
	return s
}

func (s *Server) Router() http.Handler {
	return s.router
}

func (s *Server) setupRoutes() {
	api := s.router.PathPrefix("/api/v1").Subrouter()

	// Properties
	api.HandleFunc("/properties", s.handleListProperties).Methods("GET")
	api.HandleFunc("/properties/{mint}", s.handleGetProperty).Methods("GET")
	api.HandleFunc("/properties/{mint}/investors", s.handleGetPropertyInvestors).Methods("GET")
	api.HandleFunc("/properties/{mint}/transactions", s.handleGetPropertyTransactions).Methods("GET")
	api.HandleFunc("/properties/{mint}/revenue", s.handleGetPropertyRevenue).Methods("GET")
	api.HandleFunc("/properties/{mint}/escrow", s.handleGetPropertyEscrow).Methods("GET")

	// Investors
	api.HandleFunc("/investors/{wallet}/holdings", s.handleGetInvestorHoldings).Methods("GET")
	api.HandleFunc("/investors/{wallet}/transactions", s.handleGetInvestorTransactions).Methods("GET")
	api.HandleFunc("/investors/{wallet}/claimable/{mint}", s.handleGetClaimable).Methods("GET")

	// Stats
	api.HandleFunc("/stats", s.handleGetStats).Methods("GET")
	api.HandleFunc("/stats/period", s.handleGetPeriodStats).Methods("GET")

	// Sync
	api.HandleFunc("/sync/status", s.handleGetSyncStatus).Methods("GET")
	api.HandleFunc("/sync/trigger", s.handleTriggerSync).Methods("POST")

	// Health
	s.router.HandleFunc("/health", s.handleHealth).Methods("GET")
}
```

---

## Migrações

### internal/database/migrations/001_initial.up.sql

```sql
-- Propriedades tokenizadas
CREATE TABLE IF NOT EXISTS properties (
    mint VARCHAR(50) PRIMARY KEY,
    property_state_pda VARCHAR(50),
    authority VARCHAR(50),
    seller_wallet VARCHAR(50),
    status INTEGER DEFAULT 1,
    total_supply BIGINT,
    circulating_supply BIGINT DEFAULT 0,
    decimals INTEGER DEFAULT 6,
    property_address TEXT,
    property_type VARCHAR(50),
    total_value_usd BIGINT,
    rental_yield_bps INTEGER,
    metadata_uri TEXT,
    current_epoch INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Investidores
CREATE TABLE IF NOT EXISTS investors (
    wallet VARCHAR(50),
    mint VARCHAR(50),
    token_account VARCHAR(50),
    balance BIGINT DEFAULT 0,
    last_claimed_epoch INTEGER DEFAULT 0,
    first_investment_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    PRIMARY KEY (wallet, mint)
);

CREATE INDEX idx_investors_mint ON investors(mint);

-- Transações
CREATE TABLE IF NOT EXISTS transactions (
    signature VARCHAR(100) PRIMARY KEY,
    block_time BIGINT,
    slot BIGINT,
    tx_type VARCHAR(50),
    mint VARCHAR(50),
    from_wallet VARCHAR(50),
    to_wallet VARCHAR(50),
    amount BIGINT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_mint ON transactions(mint);
CREATE INDEX idx_transactions_from ON transactions(from_wallet);
CREATE INDEX idx_transactions_type ON transactions(tx_type);

-- Receitas por época
CREATE TABLE IF NOT EXISTS revenue_epochs (
    mint VARCHAR(50),
    epoch INTEGER,
    amount BIGINT,
    total_supply_at_epoch BIGINT,
    deposited_at TIMESTAMP,
    tx_signature VARCHAR(100),
    PRIMARY KEY (mint, epoch)
);

-- Estado de sincronização
CREATE TABLE IF NOT EXISTS sync_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_slot BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO sync_state (id, last_slot) VALUES (1, 0) ON CONFLICT DO NOTHING;
```

---

## Dockerfile

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o indexer ./cmd/main.go

FROM alpine:3.19

WORKDIR /app

RUN apk --no-cache add ca-certificates

COPY --from=builder /app/indexer .

RUN adduser -D appuser
USER appuser

EXPOSE 9090

CMD ["./indexer"]
```

---

[← Voltar](./api-kyc.md) | [Próximo: Frontend →](../frontend/README.md)
