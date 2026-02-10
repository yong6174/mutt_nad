# Phase 2 Review: Smart Contracts

## Summary
Implemented MuttNFT.sol — a single ERC-1155 contract handling both genesis hatching and breeding with EIP-712 signature verification. All 17 tests pass.

## Contract: MuttNFT.sol

### Architecture
Single contract approach (no separate Breeding.sol) to keep deployment simple for MVP. All logic lives in `MuttNFT.sol`.

### Features
| Feature | Description |
|---------|-------------|
| **Genesis Hatch** | 1 per wallet, server-signed EIP-712, assigns MBTI personality (0-15) |
| **Breeding** | Requires parentA ownership, server signature, pays breed cost to partner's breeder |
| **Cooldown** | 5-minute cooldown per mutt after breeding |
| **Fee Split** | 90% to breeder, 10% to platform wallet |
| **Breed Cost** | Set by breeder, can be 0 (free) |
| **Admin** | Owner can update signer, fee %, cooldown |

### On-chain Data (per token)
```solidity
struct MuttData {
    uint8 personality;     // 0-15 MBTI index
    uint256 parentA;       // 0 = Genesis
    uint256 parentB;
    address breeder;
    uint256 breedCost;     // wei
    uint256 lastBreedTime; // cooldown tracker
}
```

### Security
- EIP-712 typed signatures prevent replay and cross-contract attacks
- Nonce per address prevents signature reuse
- Server signer = backend wallet, not user-controlled
- Fee capped at 20% max

## Tests (17/17 pass)

| Category | Tests | Status |
|----------|-------|--------|
| Genesis Hatch | 4 (success, double-hatch, invalid personality, bad sig) | PASS |
| Breeding | 7 (success, same parent, not owner, cooldown, after cooldown, insufficient cost, free cost) | PASS |
| Setters | 2 (set cost, not breeder revert) | PASS |
| Admin | 4 (fee, fee max, cooldown, signer) | PASS |

## Tech Details
- Solidity 0.8.28 (OpenZeppelin 5.x requires ^0.8.24)
- Foundry for build + test
- OpenZeppelin: ERC1155, Ownable, ECDSA, EIP712
- Deploy script: `script/Deploy.s.sol`

## Files
- `contract/src/MuttNFT.sol` — main contract
- `contract/test/MuttNFT.t.sol` — 17 test cases
- `contract/script/Deploy.s.sol` — deployment script
- `contract/foundry.toml` — config with remappings
