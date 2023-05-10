import { airdropSolIfNeeded, initializeSolSignerKeypair } from "../initializeKeypair"
import * as web3 from "@solana/web3.js"
import { PublicKey } from "@solana/web3.js"
import { readOrCreateFile } from "../readOrCreateJsonFile"

import {
  toBigNumber,
  Metaplex,
  keypairIdentity
} from "@metaplex-foundation/js"



// Add and verify NFT to collection 
export default async function addAndVerifyCollection(
  cluster: web3.Cluster,
  signer: web3.Keypair,
  collectionKey: web3.PublicKey,
  nftKeyArray: web3.PublicKey[], 
) : Promise<Array<any>> {


  // Set up Metaplex with signer
  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed')
  const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(signer))



  // Get number of NFTs with collection NFT
  const numberOfNfts = nftKeyArray.length

  let i = 0
  let arrayOfVerifications = []
  while (i < numberOfNfts) {
    // Get "NftWithToken" type from mint address
    const nft = await metaplex.nfts().findByMint( { mintAddress: nftKeyArray[i]})

    // Update metaplex data and add collection
    await metaplex
    .nfts()
    .update({
      nftOrSft: nft,
      collection: collectionKey,
    })

    console.log(`(${i+1}/${numberOfNfts}) Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=${cluster}`)
    console.log(`(${i+1}/${numberOfNfts}) Waiting to verify collection ${nftKeyArray[0]} on mint ${nftKeyArray[i]}... `)
    

    // verify collection by owner
    const { response } = await metaplex.nfts().verifyCollection({
      mintAddress: nftKeyArray[i],
      collectionMintAddress: collectionKey,
      isSizedCollection: false
    })

    // await metaplex
    // .nfts()
    // .migrateToSizedCollection( {
    //   mintAddress: arrayOfNfts[0],
    //   size: toBigNumber(1)
    // })

    console.log(`(${i+1}/${numberOfNfts}) Signature Explorer: https://explorer.solana.com/signuature/${response.signature}?cluster=${cluster}`)
    console.log('')

    arrayOfVerifications.push(response.signature)




    i++

  }

return arrayOfVerifications

}

