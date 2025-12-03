import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

// Import the IDL
const IDL = require("../target/idl/credential_program.json");

describe("credential_program", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const programId = new PublicKey("FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt");
  const program = new Program(IDL, provider);

  // Test accounts
  const admin = provider.wallet;
  const issuerAuthority = Keypair.generate();
  const holder = Keypair.generate();

  // PDAs
  let networkPda: PublicKey;
  let issuerPda: PublicKey;
  let credentialPda: PublicKey;

  before(async () => {
    // Airdrop SOL to test accounts
    const airdropTx1 = await provider.connection.requestAirdrop(
      issuerAuthority.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx1);

    const airdropTx2 = await provider.connection.requestAirdrop(
      holder.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx2);

    // Derive PDAs
    [networkPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("credential_network")],
      programId
    );

    [issuerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("issuer"), issuerAuthority.publicKey.toBuffer()],
      programId
    );

    [credentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("credential"), holder.publicKey.toBuffer()],
      programId
    );

    console.log("\n=== Test Setup ===");
    console.log("Program ID:", programId.toString());
    console.log("Admin:", admin.publicKey.toString());
    console.log("Issuer Authority:", issuerAuthority.publicKey.toString());
    console.log("Holder:", holder.publicKey.toString());
    console.log("Network PDA:", networkPda.toString());
    console.log("Issuer PDA:", issuerPda.toString());
    console.log("Credential PDA:", credentialPda.toString());
  });

  describe("1. Initialize Network", () => {
    it("should initialize the credential network", async () => {
      const networkName = "Hub Credential Network";
      const credentialFeeLamports = new anchor.BN(10000); // 0.00001 SOL

      const tx = await program.methods
        .initializeNetwork(networkName, credentialFeeLamports)
        .accounts({
          admin: admin.publicKey,
          network: networkPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("\n  Initialize Network TX:", tx);

      // Fetch and verify the network account
      const networkAccount = await program.account.credentialNetwork.fetch(networkPda);

      expect(networkAccount.admin.toString()).to.equal(admin.publicKey.toString());
      expect(networkAccount.name).to.equal(networkName);
      expect(networkAccount.credentialFeeLamports.toNumber()).to.equal(10000);
      expect(networkAccount.totalCredentialsIssued.toNumber()).to.equal(0);
      expect(networkAccount.activeCredentials.toNumber()).to.equal(0);
      expect(networkAccount.totalIssuers.toNumber()).to.equal(0);
      expect(networkAccount.isActive).to.equal(true);

      console.log("  Network Name:", networkAccount.name);
      console.log("  Network Active:", networkAccount.isActive);
      console.log("  Credential Fee:", networkAccount.credentialFeeLamports.toString(), "lamports");
    });
  });

  describe("2. Register Issuer", () => {
    it("should register a new credential issuer", async () => {
      const issuerName = "Hub KYC Provider";
      const issuerUri = "https://kyc.hub.com";

      const tx = await program.methods
        .registerIssuer(issuerName, issuerUri)
        .accounts({
          admin: admin.publicKey,
          network: networkPda,
          issuerAuthority: issuerAuthority.publicKey,
          issuer: issuerPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("\n  Register Issuer TX:", tx);

      // Fetch and verify the issuer account
      const issuerAccount = await program.account.credentialIssuer.fetch(issuerPda);

      expect(issuerAccount.authority.toString()).to.equal(issuerAuthority.publicKey.toString());
      expect(issuerAccount.name).to.equal(issuerName);
      expect(issuerAccount.uri).to.equal(issuerUri);
      expect(issuerAccount.credentialsIssued.toNumber()).to.equal(0);
      expect(issuerAccount.activeCredentials.toNumber()).to.equal(0);
      expect(issuerAccount.isActive).to.equal(true);
      expect(issuerAccount.canIssueKyc).to.equal(true);
      expect(issuerAccount.canIssueAccredited).to.equal(true);

      // Verify network was updated
      const networkAccount = await program.account.credentialNetwork.fetch(networkPda);
      expect(networkAccount.totalIssuers.toNumber()).to.equal(1);

      console.log("  Issuer Name:", issuerAccount.name);
      console.log("  Issuer URI:", issuerAccount.uri);
      console.log("  Can Issue KYC:", issuerAccount.canIssueKyc);
      console.log("  Can Issue Accredited:", issuerAccount.canIssueAccredited);
    });
  });

  describe("3. Issue Credential", () => {
    it("should issue a credential to a holder", async () => {
      const credentialType = 0; // KycBasic
      const expiryTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60); // 1 year
      const metadataUri = "https://kyc.hub.com/credentials/12345";

      const tx = await program.methods
        .issueCredential(credentialType, expiryTimestamp, metadataUri)
        .accounts({
          issuerAuthority: issuerAuthority.publicKey,
          network: networkPda,
          issuer: issuerPda,
          holder: holder.publicKey,
          credential: credentialPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([issuerAuthority])
        .rpc();

      console.log("\n  Issue Credential TX:", tx);

      // Fetch and verify the credential account
      const credentialAccount = await program.account.userCredential.fetch(credentialPda);

      expect(credentialAccount.holder.toString()).to.equal(holder.publicKey.toString());
      // Note: The program stores the issuer authority pubkey, not the issuer PDA
      expect(credentialAccount.issuer.toString()).to.equal(issuerAuthority.publicKey.toString());
      expect(credentialAccount.metadataUri).to.equal(metadataUri);
      expect(credentialAccount.version).to.equal(1);

      // Check credential type (enum)
      expect(credentialAccount.credentialType.kycBasic !== undefined).to.be.true;

      // Check status is Active
      expect(credentialAccount.status.active !== undefined).to.be.true;

      // Verify issuer was updated
      const issuerAccount = await program.account.credentialIssuer.fetch(issuerPda);
      expect(issuerAccount.credentialsIssued.toNumber()).to.equal(1);
      expect(issuerAccount.activeCredentials.toNumber()).to.equal(1);

      // Verify network was updated
      const networkAccount = await program.account.credentialNetwork.fetch(networkPda);
      expect(networkAccount.totalCredentialsIssued.toNumber()).to.equal(1);
      expect(networkAccount.activeCredentials.toNumber()).to.equal(1);

      console.log("  Holder:", credentialAccount.holder.toString());
      console.log("  Credential Type: KycBasic");
      console.log("  Status: Active");
      console.log("  Metadata URI:", credentialAccount.metadataUri);
      console.log("  Expires At:", new Date(credentialAccount.expiresAt.toNumber() * 1000).toISOString());
    });
  });

  describe("4. Verify Credential", () => {
    it("should verify an active credential", async () => {
      const tx = await program.methods
        .verifyCredential()
        .accounts({
          holder: holder.publicKey,
          credential: credentialPda,
        })
        .rpc();

      console.log("\n  Verify Credential TX:", tx);

      // Fetch the credential to check last_verified_at was updated
      const credentialAccount = await program.account.userCredential.fetch(credentialPda);

      // The credential should still be active
      expect(credentialAccount.status.active !== undefined).to.be.true;

      // last_verified_at should be updated
      expect(credentialAccount.lastVerifiedAt.toNumber()).to.be.greaterThan(0);

      console.log("  Verification Successful!");
      console.log("  Last Verified At:", new Date(credentialAccount.lastVerifiedAt.toNumber() * 1000).toISOString());
    });
  });

  describe("5. Refresh Credential", () => {
    it("should refresh/extend a credential's expiry", async () => {
      // Extend by another year
      const newExpiryTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 2 * 365 * 24 * 60 * 60); // 2 years from now

      const tx = await program.methods
        .refreshCredential(newExpiryTimestamp)
        .accounts({
          issuerAuthority: issuerAuthority.publicKey,
          issuer: issuerPda,
          holder: holder.publicKey,
          credential: credentialPda,
        })
        .signers([issuerAuthority])
        .rpc();

      console.log("\n  Refresh Credential TX:", tx);

      // Fetch and verify the credential was updated
      const credentialAccount = await program.account.userCredential.fetch(credentialPda);

      expect(credentialAccount.expiresAt.toNumber()).to.be.closeTo(
        newExpiryTimestamp.toNumber(),
        10 // Allow 10 seconds tolerance
      );

      console.log("  New Expiry:", new Date(credentialAccount.expiresAt.toNumber() * 1000).toISOString());
    });
  });

  describe("6. Revoke Credential", () => {
    it("should revoke a credential", async () => {
      const reason = "Compliance violation detected";

      const tx = await program.methods
        .revokeCredential(reason)
        .accounts({
          authority: issuerAuthority.publicKey,
          network: networkPda,
          issuer: issuerPda,
          holder: holder.publicKey,
          credential: credentialPda,
        })
        .signers([issuerAuthority])
        .rpc();

      console.log("\n  Revoke Credential TX:", tx);

      // Fetch and verify the credential was revoked
      const credentialAccount = await program.account.userCredential.fetch(credentialPda);

      // Check status is Revoked
      expect(credentialAccount.status.revoked !== undefined).to.be.true;
      expect(credentialAccount.revocationReason).to.equal(reason);

      // Verify issuer was updated
      const issuerAccount = await program.account.credentialIssuer.fetch(issuerPda);
      expect(issuerAccount.activeCredentials.toNumber()).to.equal(0);
      expect(issuerAccount.revokedCredentials.toNumber()).to.equal(1);

      // Verify network was updated
      const networkAccount = await program.account.credentialNetwork.fetch(networkPda);
      expect(networkAccount.activeCredentials.toNumber()).to.equal(0);

      console.log("  Status: Revoked");
      console.log("  Reason:", credentialAccount.revocationReason);
    });

    it("should fail to verify a revoked credential", async () => {
      try {
        await program.methods
          .verifyCredential()
          .accounts({
            holder: holder.publicKey,
            credential: credentialPda,
          })
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Check multiple possible error formats
        const errorMessage = error.message || error.toString();
        const errorCode = error.error?.errorCode?.code || error.code || "";
        const errorNumber = error.error?.errorCode?.number;

        // The program returns CredentialNotActive (6005) for revoked credentials
        // because revoked credentials are no longer active
        const isInvalidCredentialError =
          errorCode === "CredentialNotActive" ||
          errorCode === "CredentialRevoked" ||
          errorNumber === 6005 ||
          errorNumber === 6007 ||
          errorMessage.includes("CredentialNotActive") ||
          errorMessage.includes("CredentialRevoked") ||
          errorMessage.includes("not active");

        console.log("\n  Verification correctly rejected revoked credential");
        console.log("  Error code:", errorCode);
        console.log("  Error number:", errorNumber);

        expect(isInvalidCredentialError).to.be.true;
      }
    });
  });

  describe("7. Summary", () => {
    it("should display final state", async () => {
      const networkAccount = await program.account.credentialNetwork.fetch(networkPda);
      const issuerAccount = await program.account.credentialIssuer.fetch(issuerPda);
      const credentialAccount = await program.account.userCredential.fetch(credentialPda);

      console.log("\n=== Final State ===");
      console.log("\nNetwork:");
      console.log("  Total Credentials Issued:", networkAccount.totalCredentialsIssued.toString());
      console.log("  Active Credentials:", networkAccount.activeCredentials.toString());
      console.log("  Total Issuers:", networkAccount.totalIssuers.toString());

      console.log("\nIssuer:");
      console.log("  Credentials Issued:", issuerAccount.credentialsIssued.toString());
      console.log("  Active Credentials:", issuerAccount.activeCredentials.toString());
      console.log("  Revoked Credentials:", issuerAccount.revokedCredentials.toString());

      console.log("\nCredential:");
      console.log("  Holder:", credentialAccount.holder.toString());
      console.log("  Status:", Object.keys(credentialAccount.status)[0]);
      console.log("  Revocation Reason:", credentialAccount.revocationReason);
    });
  });
});
