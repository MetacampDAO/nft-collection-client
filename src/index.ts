import { initializeSolSignerKeypair, airdropSolIfNeeded } from "../scripts/initializeKeypair"
import * as web3 from "@solana/web3.js"

import { createCollection, createNfts } from "../scripts/metaplex/createNftsOrCollection"
import addAndVerifyCollection from "../scripts/metaplex/addNftToCollection"


main().then(() => {
  console.log('Finished successfully')
  console.log(``)
  process.exit(0)
}).catch(error => {
  console.log(error)
  process.exit(1)
})

async function main() {

  // Set cluster and connection
  const cluster = 'devnet'
  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed')

  // Create user and airdrop SOL if needed
  const signer = initializeSolSignerKeypair()
  await airdropSolIfNeeded(connection, signer.publicKey, 2, 0.05)

  // Create collection NFT 
  console.log(`\n***NEXT PROCESS - CREATING COLLECTION ... \n`)
  const collectionKey = await createCollection(cluster, signer, 'assets')

  // Create NFTs 
  console.log(`\n***NEXT PROCESS - CREATING NFT(s) ... \n`)
  const nftArray = await createNfts(cluster, signer, 'assets')
  console.log(`***RESULT - NUMBER OF NFT(S) CREATED: ${nftArray.length} \n`)

  // Add and verify NFT to collection
  console.log(`\n***NEXT PROCESS - ADDING AND VERIFYING COLLECTION ${collectionKey} TO NFT(S) ... \n`)
  const arrayOfVerifications = await addAndVerifyCollection(cluster, signer, collectionKey, nftArray)
  console.log(`***RESULT - NUMBER OF NFT(S) ADDED AND VERIFIED TO COLLECTION: ${arrayOfVerifications.length} \n`)

  
  return nftArray

}
