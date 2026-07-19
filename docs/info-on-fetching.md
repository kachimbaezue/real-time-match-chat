To technically fetch the historical World Cup data using the TxLINE API, you will need to execute the on-chain subscription, sign an activation message to retrieve your production token, and then query the historical API endpoints.

Here is a complete, step-by-step technical implementation guide based on the [World Cup Free Tier Documentation](https://txline.txodds.com/documentation/worldcup):

### Step 1: Install Dependencies & Initialize the Connection

First, install the necessary Solana and HTTP client libraries in your project:

```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token axios tweetnacl

```

Set up your environment variables or configuration matching the network you want to target. For Mainnet production data:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection, SystemProgram } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import axios from "axios";
import nacl from "tweetnacl";
import txoracleIdl from "./idl/txoracle.json"; // Your loaded TxLINE IDL file

const apiOrigin = "https://txline.txodds.com";
const apiBaseUrl = `${apiOrigin}/api`;
const programId = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const txlTokenMint = new PublicKey("Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL");

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const provider = anchor.AnchorProvider.env(); // Assumes local environment/wallet setup
const program = new anchor.Program(txoracleIdl, provider);

```

### Step 2: Execute the On-Chain Subscription

Even though the World Cup tier is free and requires 0 `$TXL` tokens, you must register your wallet by executing a transaction on the Solana blockchain.

```typescript
// Service Level 1 gives 60-second delayed historical/live access
const SERVICE_LEVEL_ID = 1; 
const DURATION_WEEKS = 4; 

const [tokenTreasuryPda] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], program.programId);
const tokenTreasuryVault = getAssociatedTokenAddressSync(txlTokenMint, tokenTreasuryPda, true, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
const [pricingMatrixPda] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], program.programId);
const userTokenAccount = getAssociatedTokenAddressSync(txlTokenMint, provider.wallet.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

// Call the smart contract
const txSig = await program.methods.subscribe(SERVICE_LEVEL_ID, DURATION_WEEKS)
  .accounts({
    user: provider.wallet.publicKey,
    pricingMatrix: pricingMatrixPda,
    tokenMint: txlTokenMint,
    userTokenAccount,
    tokenTreasuryVault,
    tokenTreasuryPda,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log("Subscription registered with Transaction Signature:", txSig);

```

### Step 3: Authenticate and Activate Your API Token

After the transaction registers, you must obtain a temporary guest JWT, sign it along with your transaction signature using your wallet, and exchange it for a long-lived `apiToken`.

```typescript
// 1. Get guest authentication token
const authResponse = await axios.post(`${apiOrigin}/auth/guest/start`);
const jwt = authResponse.data.token;

// 2. Format the validation message format (Empty brackets for default league bundle)
const SELECTED_LEAGUES: number[] = []; 
const messageString = `${txSig}:${SELECTED_LEAGUES.join(",")}:${jwt}`;
const message = new TextEncoder().encode(messageString);

// 3. Cryptographically sign the payload with your private key
const localPayer = (provider.wallet as any).payer;
const signatureBytes = nacl.sign.detached(message, localPayer.secretKey);
const walletSignature = Buffer.from(signatureBytes).toString("base64");

// 4. Submit to activation endpoint
const activationResponse = await axios.post(`${apiBaseUrl}/token/activate`, {
  txSig,
  walletSignature,
  leagues: SELECTED_LEAGUES,
}, {
  headers: { Authorization: `Bearer ${jwt}` }
});

const apiToken = activationResponse.data.token || activationResponse.data;
console.log("Production API Token successfully generated.");

```

### Step 4: Query the Historical Replay Data

Now that you have your authorized credentials (`jwt` and `apiToken`), you can issue standard HTTP requests to their historical endpoints.

To fetch historical scores, match states, and event summaries, make a `GET` request to their historical data endpoint:

```typescript
async function fetchHistoricalData() {
  try {
    const response = await axios.get(`${apiBaseUrl}/scores/historical`, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'X-Api-Token': apiToken
      },
      params: {
        // You will query by target tournament IDs or historical date ranges matching past World Cups
        tournament_id: "WORLD_CUP_HISTORICAL_ID", 
        limit: 10
      }
    });
    
    console.log("Historical World Cup Data: ", response.data);
  } catch (error) {
    console.error("Failed to fetch historical snapshots:", error);
  }
}

fetchHistoricalData();

```

> 💡 **Note on API Headers:** Ensure you pass *both* the `Authorization` header containing the guest token, and the `X-Api-Token` header containing your validated access token on every single query to the historical feeds.