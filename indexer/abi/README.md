# Contract ABIs

Place your contract ABI JSON files here:

1. `AgentRegistry.json` - ABI for the AgentRegistry contract
2. `JobEscrow.json` - ABI for the JobEscrow contract

## Generating TypeScript Type Definitions

After adding ABI files, run:

```bash
npm run typegen
```

This will generate TypeScript type definitions in `src/abi/` directory using Subsquid's EVM typegen.

## Example ABI Structure

Your ABI files should be standard Solidity JSON ABI format exported from your contract compilation (Hardhat/Foundry).

Example placement:
```
abi/
├── AgentRegistry.json
└── JobEscrow.json
```

After running typegen, you'll have:
```
src/abi/
├── AgentRegistry.ts
└── JobEscrow.ts
```

These generated files contain type-safe event decoders and function encoders.
