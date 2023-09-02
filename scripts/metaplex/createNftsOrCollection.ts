import { airdropSolIfNeeded, initializeSolSignerKeypair } from "../dummy-user/initializeKeypair"
import * as web3 from "@solana/web3.js"
import { loadNFTFromFilesystem } from '@nftstorage/metaplex-auth'
import { NFTStorage } from 'nft.storage'
import { readOrCreateFile } from "./readOrCreateJsonFile"
import dotenv from 'dotenv'
dotenv.config()


import {
  Metaplex,
  keypairIdentity,
  CreateCompressedNftOutput
} from "@metaplex-foundation/js"
import * as fs from "fs"


const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_AUTH


let main = async () => {
  const cluster = 'devnet'
  const connection = new web3.Connection(web3.clusterApiUrl(cluster))
  const user = await initializeSolSignerKeypair()
  await airdropSolIfNeeded(connection, user.publicKey, 2, 0.05)

  // Create Nfts through the asset directory
  const assetDirectory = "assets" 
  const arrayOfNfts = await createNfts(cluster, user, assetDirectory)

  return arrayOfNfts

}

// create Collection NFT
export let createCollection = async (
  cluster: web3.Cluster,
  signer: web3.Keypair,
  directoryPath: string
): Promise<web3.PublicKey> => {

  // Checking files in asset directory
  const files = await fs.promises.readdir(directoryPath);
  const collectionFiles = files.filter(file => file.startsWith("collection.json"));
  console.log(`${collectionFiles.length} collection.json file found. \n`);

  // Create Collection mint
  console.log(`Creating NFT from collection.json ...`)
  const collectionData = await createNft(cluster, signer, directoryPath + "/collection.json");
  console.log(`Created Collection NFT Explorer: https://explorer.solana.com/address/${collectionData.nft.address.toString()}?cluster=${cluster}`)
  await readOrCreateFile(`${collectionData.nft.address}.json`, "collections/", { "referenceKey" : collectionData.nft.address })
  console.log(`Saved collection to ${directoryPath}/collections/${collectionData.nft.address}.json \n`)

  // Return collection key
  return collectionData.nft.address;

}


// create NFT
export let createNfts = async (
  cluster: web3.Cluster,
  signer: web3.Keypair,
  assetDirectory: string
): Promise<web3.PublicKey[]> => {

  // Checking files in asset directory
  const jsonType = '.json';
  const files = await fs.promises.readdir(assetDirectory);
  const jsonFiles = files.filter(file => file.endsWith(jsonType));
  const collectionFiles = files.filter(file => file.startsWith("collection.json"));
  console.log(`${jsonFiles.length - collectionFiles.length} NFT JSON file(s) are found. \n`);



  // Creating NFTs
  const numberOfNfts = jsonFiles.length - collectionFiles.length;
  const NftArray: web3.PublicKey[] = [];

  for (let i = 0; i < numberOfNfts; i++) {
    
    // Create NFT mint
    console.log(`(${i+1}/${numberOfNfts}) Creating NFT from ${i}.json ...`)
    const mintData = await createNft(cluster, signer, assetDirectory + `/${i}.json`);
    console.log(`(${i+1}/${numberOfNfts}) Created NFT Explorer: https://explorer.solana.com/address/${mintData.nft.address.toString()}?cluster=${cluster} \n`)
    NftArray.push(mintData.nft.address);

  }



  // Return the array of NFT keys
  return NftArray;

}


export let createNft = async (
  cluster: web3.Cluster,
  signer: web3.Keypair,
  assetPath: string
) : Promise<CreateCompressedNftOutput> => {


  const connection = new web3.Connection(web3.clusterApiUrl(cluster), 'confirmed')

  // Setup Metaplex bundlrStorage and signer
  const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(signer))
  
  // NFT Storage Client
  const client = new NFTStorage({ token: NFT_STORAGE_API_KEY as string})

  // Preparing assets
  let nft = await loadNFTFromFilesystem(`${assetPath}`)

  // Upload NFT to NFT-Storage
  const metadata = await client.storeCar(nft.encodedAssets.car)
  console.log(metadata)
  console.log(`JSON file uploaded to ${nft.metadataGatewayURL}`)
  console.log(`Image file uploaded to ${nft.metadata.image}`)


  // Send tx to Solana and create NFT
  const data = await metaplex
    .nfts()
    .create({
      uri: nft.metadataGatewayURL,
      name: nft.metadata.name,
      sellerFeeBasisPoints: nft.metadata.seller_fee_basis_points as number,
      symbol: nft.metadata.symbol,
      // uses: {
      //   useMethod: nft.metadata.uses.useMethod,
      //   remaining: nft.metadata.uses.remaining,
      //   total: nft.metadata.uses.total
      // }
      // maxSupply: null
      },
      { commitment: "finalized" }
    )

  console.log(`Signature Explorer: https://explorer.solana.com/tx/${data.response.signature}?cluster=${cluster}`)

  return data

}