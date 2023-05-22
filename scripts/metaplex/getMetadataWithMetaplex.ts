/**
 * metaplex.nfts()
 * .findByMint()
 * .findAllByMintList()
 * .load()
 * .findAllByOwner()
 * .findAllByCreator()
 * .uploadMetadata()
 * .create()
 * .update()
 * .printNewEdition()
 * .use()
 */

import { 
    BundlrStorageDriver,
    Metaplex, 
    bundlrStorage, // Arweave Storage
    Nft,
    PublicKey
} from "@metaplex-foundation/js"
import * as web3 from "@solana/web3.js"
import { initializeSolSignerKeypair, airdropSolIfNeeded } from "../initializeKeypair"

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })

export async function main() {

    // Connect to cluster, rpc node, and set up metaplex client
    const cluster: web3.Cluster = "devnet"
    const connection = new web3.Connection(web3.clusterApiUrl(cluster))
    const metaplex = Metaplex.make(connection)
        .use(bundlrStorage({
            address: 'https://devnet.bundlr.network',
            providerUrl: 'https://api.devnet.solana.com',
            timeout: 60000,
        }))

    // Get or create Keypair for user, and airdrop SOL if needed
    const user = await initializeSolSignerKeypair()
    await airdropSolIfNeeded(connection, user.publicKey, 2, 0.05)




    // Upload Metadata
    let uploadedMetadata = await metaplex.nfts().uploadMetadata(
        {
            uri: "https://shdw-drive.genesysgo.net/GG2JGfReXdLG683cy9tBcEKhhLeVDwV6oJQLpNpzArba/hot_pass_metadata.json",
            name: "Master Copy of Metacamp Pass",
            description: "The description of Metacamp is ...",
            sellerFeeBasisPoints: 500,
            symbol: "MCP",
            attributes: [
                {   
                    trait_type: "test_trait",
                    value: "test_value"
                }
            ]
        },
        { commitment: "finalized" }
    )
    console.log(`Uploaded Metadata: ${uploadedMetadata}`)

    // Create Nft
    let createdNft = await metaplex.nfts().create(
        {
            uri: uploadedMetadata.metadata.external_url!,
            name: uploadedMetadata.metadata.name!,
            sellerFeeBasisPoints: uploadedMetadata.metadata.seller_fee_basis_points!,
            symbol: uploadedMetadata.metadata.symbol!,
            uses: {
              useMethod: 0,
              remaining: 5,
              total: 5
            },
            maxSupply: null
        },
        { commitment: "finalized" }
    )
    console.log(`Created Nft: ${createdNft}`)


    let byMint = await metaplex.nfts().findByMint({
        mintAddress: createdNft.mintAddress
    })
    console.log(`findByMint: ${byMint}`)

    let byMintList = await metaplex.nfts().findAllByMintList(
        [createdNft.mintAddress]
    )
    console.log(`findAllByMintList: ${byMintList}`)

    let byOwner = await metaplex.nfts().findAllByOwner()
    console.log(`findAllByOwner: ${byOwner}`)

    let byCreator = await metaplex.nfts().findAllByCreator()
    console.log(`findAllByCreator: ${byCreator}`)

    let loadedNft = await metaplex.nfts().load()
    console.log(`load: ${loadedNft}`)


    let updatedNft = await metaplex.nfts().update()
    console.log(`update: ${updatedNft}`)

    let usedNft = await metaplex.nfts().use()
    console.log(`use: ${usedNft}`)

    let printedNft = await metaplex.nfts().printNewEdition()
    console.log(`printNewEdition: ${printedNft}`)




}