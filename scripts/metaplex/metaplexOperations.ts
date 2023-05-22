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
    PublicKey,
    Metadata,
    keypairIdentity
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

    // Set signer for metaplex to user
    metaplex.use(keypairIdentity(user))


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
            uri: uploadedMetadata!.metadata!.external_url!,
            name: uploadedMetadata!.metadata!.name!,
            sellerFeeBasisPoints: uploadedMetadata!.metadata!.seller_fee_basis_points!,
            symbol: uploadedMetadata!.metadata!.symbol!,
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

    // Find by Mint
    let byMint = await metaplex.nfts().findByMint({
        mintAddress: createdNft.mintAddress
    })
    console.log(`findByMint: ${byMint}`)

    // Find all by Mint list
    let byMintList = await metaplex.nfts().findAllByMintList({
        mints: [createdNft.mintAddress]
    }
    )
    console.log(`findAllByMintList: ${byMintList}`)

    // load Nft
    let loadedNft = await metaplex.nfts().load({
        metadata: byMintList[0] as Metadata
    })
    console.log(`load: ${loadedNft}`)


    // Find all by Owner
    let owner = new web3.PublicKey("JonasQ6kwFknJKQpVXbAs2d3fdVLy2DnXd13ynwhgV4")
    let byOwner = await metaplex.nfts().findAllByOwner({
        owner: owner
    })
    console.log(`findAllByOwner: ${byOwner}`)

    // Find all by Creator
    let creator = new web3.PublicKey("JonasQ6kwFknJKQpVXbAs2d3fdVLy2DnXd13ynwhgV4")
    let byCreator = await metaplex.nfts().findAllByCreator({
        creator: creator
    })
    console.log(`findAllByCreator: ${byCreator}`)


    // Update Nft
    let collectionPubkey = new web3.PublicKey("JonasQ6kwFknJKQpVXbAs2d3fdVLy2DnXd13ynwhgV4")
    let updatedNft = await metaplex.nfts().update({
        nftOrSft: byMint,
        collection: collectionPubkey
    })
    console.log(`update: ${updatedNft}`)

    // Use Nft
    let usedNft = await metaplex.nfts().use({
        mintAddress: new web3.PublicKey(byMint.mint)
    })
    console.log(`use: ${usedNft}`)

    // Print Nft
    let printedNft = await metaplex.nfts().printNewEdition({
        originalMint: new web3.PublicKey(byMint.mint)
    }
    )
    console.log(`printNewEdition: ${printedNft}`)




}