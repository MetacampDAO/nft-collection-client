import { airdropSolIfNeeded, initializeSolSignerKeypair } from "../initializeKeypair"
import * as web3 from "@solana/web3.js"

import {
  PROGRAM_ADDRESS as metaplexProgramId,
} from "@metaplex-foundation/mpl-token-metadata";


import dotenv from 'dotenv'
import { updateJsonFile, readOrCreateFile } from "../readOrCreateJsonFile"
import { getMetadata , type Metadata} from "./getMetadata"
import { TOKEN_PROGRAM_ID, getAccount } from "@solana/spl-token";
dotenv.config()

// Specify Collection Pubkey
const pubKey = new web3.PublicKey("EF6Y7xTmoPnpaF4jAUPfKXpeifXR2jDAyaRT3adE5XNN")

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })


async function main() {

  // Connect to cluster
  const cluster: web3.Cluster = "devnet"
  const connection = new web3.Connection(web3.clusterApiUrl(cluster))
  // const connection = new web3.Connection(process.env.MAINNET_CONNECTION ?? "")

  // Get or create Keypair for user
  const user = await initializeSolSignerKeypair()
  await airdropSolIfNeeded(user, connection, 2, 0.05)


  // Call function to get NFT data and store under ${pubKey}.json
  await getNfts(connection, pubKey, "collections")

}



// Update NFT
async function getNfts(
  connection: web3.Connection,
  pubKey: web3.PublicKey,
  directoryPath: string
) {

  // // Read or get signatures by reference key
  let signatures : web3.ConfirmedSignatureInfo[] = await getAllSignaturesFromPubkey(connection, pubKey, directoryPath, "signatures")

  // // Read or get tx from signatures
  let transactions : (web3.TransactionResponse | null)[]  = await getAllTxsFromSignatures(connection, pubKey, directoryPath, "signatures", "transactions", 25)

  // Parse metadata accounts from tx
  let metadataAccounts : web3.PublicKey[] = await parseTxMetadataAccounts(pubKey, directoryPath, "transactions", "metadataAccounts")

  // Read or get metadata from metadata accounts
  let metadataArray : Metadata[] = await getMetadata(connection, pubKey, directoryPath, "metadataAccounts", "metadataArray", 25)

  // Get mints from metadata
  let mintArray : web3.PublicKey[] = await getMintsFromMetadata(pubKey, directoryPath, "metadataArray", "mintAccounts")






  return mintArray

}


async function getAllSignaturesFromPubkey(
  connection: web3.Connection,
  pubKey: web3.PublicKey,
  directoryPath: string,
  fieldName: string,
  skip?: boolean
) : Promise<web3.ConfirmedSignatureInfo[]>{

  // Console log progress
  let timeLabel = `getAllSignaturesFromPubkey`
  console.time(timeLabel);
  let counter = 0;

  // Define variables
  let signatures : Array<web3.ConfirmedSignatureInfo> = (await readOrCreateFile(`${pubKey}.json`, directoryPath, { "referenceKey" : pubKey }))[`${fieldName}`]
  if (!signatures) { signatures = []}
  let lastSignature : web3.ConfirmedSignatureInfo
  let newSignatures : Array<web3.ConfirmedSignatureInfo>

  // Check if skip
  if (!skip) {
    do {
      // Check existing signatures, if not, get first signatures
      if (!Array.isArray(signatures) || signatures.length == 0 || signatures.every(item => item === null)) {
        newSignatures = await getSignaturesFromPubkey(connection, pubKey)
        updateJsonFile(directoryPath + `${pubKey}.json`, pubKey, `${fieldName}`, newSignatures)
      }
  
      // Get all signatures
      signatures = (await readOrCreateFile(`${pubKey}.json`, directoryPath))[`${fieldName}`]
      lastSignature  = signatures[signatures.length - 1]
      newSignatures = await getSignaturesFromPubkey(connection, pubKey, lastSignature)
      signatures.push(... newSignatures)
      updateJsonFile( directoryPath + `${pubKey}.json`, pubKey, `${fieldName}`, signatures)
      process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${signatures.length}\x1b[0m/?` + ' Getting all signatures ... ');
  
    } while (newSignatures.length > 0)
    process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${signatures.length}\x1b[0m/?` + ' Getting all signatures ... ');
  }


  // Console log ending
  console.timeEnd(timeLabel);
  process.stdout.write(`\r✅ Found ${signatures.length} signature(s)`);
  console.log('\n \n');

  return signatures

}


async function getSignaturesFromPubkey(
  connection: web3.Connection, 
  pubkey: web3.PublicKey, 
  lastSignatureInfo?: web3.ConfirmedSignatureInfo ) {

  let options = {
    before: lastSignatureInfo?.signature,
  };
  let signatures : Array<web3.ConfirmedSignatureInfo> = await connection.getSignaturesForAddress(
    pubkey,
    options
  );

  return signatures
}


async function getAllTxsFromSignatures(
  connection: web3.Connection,
  pubKey: web3.PublicKey,
  directoryPath: string,
  sigFieldName: string,
  txFieldName: string,
  batchSize: number = 100,
  skip?: boolean
  ) : Promise<(web3.TransactionResponse | null)[]> {

    // Console log progress
    let timeLabel = `getAllTxsFromSignatures`
    console.time(timeLabel);
    let counter = 0;

    // Read existing signatures and transactions
    let signatures : web3.ConfirmedSignatureInfo[] = (await readOrCreateFile(`${pubKey}.json`, directoryPath))[`${sigFieldName}`]
    if (!signatures) { signatures = []}
    let transactions : (web3.TransactionResponse | null)[] = (await readOrCreateFile(`${pubKey}.json`, directoryPath))[`${txFieldName}`]
    if (!transactions) { transactions = []}
    let newTxs : (web3.TransactionResponse | null)[]

    // Check if skipping
    if (!skip) {

      // Check if transactions exist
      if (!Array.isArray(transactions) || transactions.length == 0 || transactions.every(item => item === null)) {
        transactions = []

        let sigBatch = signatures.slice(transactions.length, transactions.length + batchSize).map(batch => batch.signature);
        //@ts-ignore
        newTxs = await connection.getTransactions(sigBatch, {maxSupportedTransactionVersion: 0})

        transactions.push(... newTxs)
        updateJsonFile( directoryPath + `${pubKey}.json`, pubKey, `${txFieldName}`, transactions)
      }

      while (transactions.length < signatures.length) {

        let sigBatch = signatures.slice(transactions.length, transactions.length + batchSize).map(batch => batch.signature);   
        //@ts-ignore     
        newTxs = await connection.getTransactions(sigBatch, {maxSupportedTransactionVersion: 0}!)

        transactions.push(... newTxs)
        updateJsonFile( directoryPath + `${pubKey}.json`, pubKey, `${txFieldName}`, transactions)
        process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${transactions.length}\x1b[0m/${signatures.length} transaction(s) found ... `)
      }  
      process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${transactions.length}\x1b[0m/${signatures.length} transaction(s) found ... `)
    } 

    // Console log ending
    console.timeEnd('getAllTxsFromSignatures');
    process.stdout.write(`\r✅ Found ${transactions.length} transaction(s)`)
    console.log('\n \n');


    return transactions

}


async function parseTxMetadataAccounts( 
  pubKey: web3.PublicKey,
  directoryPath: string,
  txFieldName: string,
  accountsFieldName: string,
  skip?: boolean
  ) : Promise<web3.PublicKey[]> {
  
  // Console log progress
  let timeLabel = 'parseTxMetadataAccounts'
  console.time(timeLabel);
  let counter = 0;

  
  const CANDY_MACHINE_V1_ID = "cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ"
  const CANDY_MACHINE_V2_ID = "cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ"
  const CANDY_MACHINE_V3_ID = "CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR"
  
  let metadataAccounts: web3.PublicKey[] = (readOrCreateFile(`${pubKey}.json`, directoryPath, { "referenceKey" : pubKey }))[`${accountsFieldName}`] 
  if (!metadataAccounts) { metadataAccounts = [] }
  let transactions : web3.TransactionResponse[] = (readOrCreateFile(`${pubKey}.json`, directoryPath, { "referenceKey" : pubKey }))[`${txFieldName}`]
  if (!transactions) { transactions = []}

  

  if (metadataAccounts.length == 0 || metadataAccounts === undefined) {
    // Loop and only look in transactions that call the Metaplex token metadata program
    for (const tx of transactions) {
     
      if (tx) {

        // Convert to string for checking Metaplex Metadata Program Id
        let accountKeys = tx?.transaction?.message?.accountKeys?.map((p) => {
          if (p === undefined) {
            return ""; // skip undefined elements
          }
          return p.toString()
        });


        // Check if interacted with Metaplex Metadata Program
        if (accountKeys?.includes(metaplexProgramId)) {

          // Check inner instructions
          for (const iIx of tx!.meta!.innerInstructions!) {

            for (const ix of iIx.instructions) {
              if (
                ix.data == "4xY" // VerifyCollection instruction
                &&
                accountKeys[ix.programIdIndex] == metaplexProgramId
              ) {
                let metadataAccountIndex = ix.accounts[2];
                let metadataAccount = tx!.transaction.message.accountKeys[metadataAccountIndex];
                metadataAccounts.push(metadataAccount);
                process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${counter}\x1b[0m` + ' Parsing transactions for metadata accounts ... ');
              } 
              
              else if (
                (
                  ix.data == "K" || // VerifyCollection instruction
                  ix.data == "S" || // SetAndVerifyCollection instruction
                  ix.data == "X" || // VerifySizedCollectionItem instruction
                  ix.data == "Z"  // SetAndVerifySizedCollectionItem instruction
                ) 
                &&
                accountKeys[ix.programIdIndex] == metaplexProgramId
              ) {
                let metadataAccountIndex = ix.accounts[0];
                let metadataAccount = tx!.transaction.message.accountKeys[metadataAccountIndex];
                metadataAccounts.push(metadataAccount);
                process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${counter}\x1b[0m` + ' Parsing transactions for metadata accounts ... ');
              }
              
            }
          }

          // Check message instructions
          for (const ix of tx!.transaction.message.instructions) {

            // Filter for setAndVerify or verify instructions in the Metaplex token metadata program
            if (
                (
                  ix.data == "K" || // VerifyCollection instruction
                  ix.data == "S" || // SetAndVerifyCollection instruction
                  ix.data == "X" || // VerifySizedCollectionItem instruction
                  ix.data == "Z"  // SetAndVerifySizedCollectionItem instruction
                ) 
                &&
                accountKeys[ix.programIdIndex] == metaplexProgramId
            ) {
              let metadataAccountIndex = ix.accounts[0];
              let metadataAccount = tx!.transaction.message.accountKeys[metadataAccountIndex];
              metadataAccounts.push(metadataAccount);
              process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${counter}\x1b[0m` + ' Parsing transactions for metadata accounts ... ');
            }

            else if (
              ix.data == "4xY" // VerifyCollection instruction
              &&
              accountKeys[ix.programIdIndex] == metaplexProgramId
            ) {
              let metadataAccountIndex = ix.accounts[2];
              let metadataAccount = tx!.transaction.message.accountKeys[metadataAccountIndex];
              metadataAccounts.push(metadataAccount);
              process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${counter}\x1b[0m}` + ' Parsing transactions for metadata accounts ... ');
            }

          }
        }
      }
    }
  }

  updateJsonFile( directoryPath + `${pubKey}.json`, pubKey, `${accountsFieldName}`, metadataAccounts)
  

  // Console log ending
  console.timeEnd(timeLabel);
  console.log(`\r✅ Found ${metadataAccounts.length} metadata account(s) from ${transactions.length} transaction(s)`)
  console.log('\n');

  return metadataAccounts
}


async function getMintsFromMetadata(
  pubKey: web3.PublicKey,
  directoryPath: string,
  metadataFieldName: string,
  mintFieldName: string,
  skip?: boolean
) : Promise<web3.PublicKey[]>{

  // Console log progress
  let timeLabel = `getMintsFromMetadata`
  console.time(timeLabel);
  let counter = 0;
  

  // Define variables
  let metadataArray : Metadata[] = (readOrCreateFile(`${pubKey}.json`, directoryPath, { "referenceKey" : pubKey }))[`${metadataFieldName}`]
  if (!metadataArray) { metadataArray = []}
  let mintArray : web3.PublicKey[] = (readOrCreateFile(`${pubKey}.json`, directoryPath, { "referenceKey" : pubKey }))[`${mintFieldName}`] = []


  // Check if skip
  if (!skip) {
    let mintAccountsString = ""
    for (let metadata of metadataArray) {
      let mint = new web3.PublicKey(metadata.mint)
      if (!(mintAccountsString.includes(mint.toString()))){ 
        mintAccountsString = mintAccountsString + "," + mint
        mintArray.push(mint)
      }
      process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${mintArray.length}\x1b[0m/${metadataArray.length}` + ' Getting mint accounts from metadata ... ');
    }
    
  }

  updateJsonFile( directoryPath + `${pubKey}.json`, pubKey, `${mintFieldName}`, mintArray)

  // Console log ending
  console.timeEnd(timeLabel);
  console.log(`\r✅ Found ${mintArray.length} unique mint account(s)`)
  console.log('\n');

  return mintArray

}


async function getOwnersFromMints (
  connection: web3.Connection,
  pubKey: string,
  directoryPath: string,
  mintFieldName: string,
  ownersFieldName: string,
  batchSize: number = 100,
  skip?: boolean
) {

  // Console log progress
  let timeLabel = `getOwnersFromMints`
  console.time(timeLabel);
  let counter = 0;

  let owners = (await readOrCreateFile(`owners_${pubKey}.json`, directoryPath))[`${ownersFieldName}`]
  if (!owners) { owners = {} }
  let mintArray = (await readOrCreateFile(`${pubKey}.json`, directoryPath))[`${mintFieldName}`]

  // Get token holder of mint
  for (let mint of mintArray) {
    const largestAccounts = await connection.getTokenLargestAccounts(
      mint
    );
    const tokenAccount = await getAccount(connection, largestAccounts.value[0].address)
    console.log(`Owner of ${mint}: ${tokenAccount.owner.toString()}`);
    process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${owners.length}\x1b[0m/?` + ' Getting owners ... ');
  }

  updateJsonFile( directoryPath + `owners_${pubKey}.json`, pubKey, `${ownersFieldName}`, owners)


  // Console log ending
  console.timeEnd(timeLabel);
  console.log(`\r✅ Found ${owners.length} for ${mintArray.length} mints \n`)

}


