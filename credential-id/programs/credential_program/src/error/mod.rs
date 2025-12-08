use anchor_lang::prelude::*;

#[error_code]
pub enum CredentialError {
    #[msg("Network is not active")]
    NetworkNotActive,

    #[msg("Issuer is not authorized")]
    IssuerNotAuthorized,

    #[msg("Issuer is not active")]
    IssuerNotActive,

    #[msg("Credential already exists for this holder")]
    CredentialAlreadyExists,

    #[msg("Credential not found")]
    CredentialNotFound,

    #[msg("Credential is not active")]
    CredentialNotActive,

    #[msg("Credential has expired")]
    CredentialExpired,

    #[msg("Credential has been revoked")]
    CredentialRevoked,

    #[msg("Invalid credential type")]
    InvalidCredentialType,

    #[msg("Invalid expiry timestamp")]
    InvalidExpiry,

    #[msg("Unauthorized - only admin can perform this action")]
    UnauthorizedAdmin,

    #[msg("Unauthorized - only issuer can perform this action")]
    UnauthorizedIssuer,

    #[msg("Name too long")]
    NameTooLong,

    #[msg("URI too long")]
    UriTooLong,

    #[msg("Reason too long")]
    ReasonTooLong,
}
