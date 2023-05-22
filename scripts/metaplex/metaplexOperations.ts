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
    console.log(`\x1b[32mUploaded Metadata:\x1b[0m ${JSON.stringify(uploadedMetadata, null, 2)}\n`)

    // Create Nft
    let createdNft = await metaplex.nfts().create(
        {
        
            uri: uploadedMetadata.uri,
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
    console.log(`\x1b[32mCreated Nft:\x1b[0m ${JSON.stringify(createdNft, null, 2)}\n`)

    // Find by Mint
    let byMint = await metaplex.nfts().findByMint({
        mintAddress: createdNft.mintAddress
    })
    console.log(`\x1b[32mfindByMint:\x1b[0m ${JSON.stringify(byMint, null, 2)}\n`)

    // Find all by Mint list
    let byMintList = await metaplex.nfts().findAllByMintList({
        mints: [createdNft.mintAddress]
    }
    )
    console.log(`\x1b[32mfindAllByMintList:\x1b[0m ${JSON.stringify(byMintList, null, 2)}\n`)

    // load Nft
    let loadedNft = await metaplex.nfts().load({
        metadata: byMintList[0] as Metadata
    })
    console.log(`\x1b[32mload:\x1b[0m ${JSON.stringify(loadedNft, null, 2)}\n`)


    // Find all by Owner
    let owner = new web3.PublicKey("JonasQ6kwFknJKQpVXbAs2d3fdVLy2DnXd13ynwhgV4")
    let byOwner = await metaplex.nfts().findAllByOwner({
        owner: owner
    })
    console.log(`\x1b[32mfindAllByOwner:\x1b[0m ${JSON.stringify(byOwner, null, 2)}\n`)

    // Find all by Creator
    let creator = new web3.PublicKey("JonasQ6kwFknJKQpVXbAs2d3fdVLy2DnXd13ynwhgV4")
    let byCreator = await metaplex.nfts().findAllByCreator({
        creator: creator
    })
    console.log(`\x1b[32mfindAllByCreator:\x1b[0m ${JSON.stringify(byCreator, null, 2)}\n`)


    // Update Nft
    let collectionPubkey = new web3.PublicKey("41jnrm6adfmLqCumHieRMkSFzP6Y8Lg8dFKtb6X1fWf7")
    let updatedNft = await metaplex.nfts().update({
        nftOrSft: byMint,
        collection: collectionPubkey
    })
    console.log(`\x1b[32mupdate:\x1b[0m ${JSON.stringify(updatedNft, null, 2)}\n`)

    // Use Nft
    let usedNft = await metaplex.nfts().use({
        mintAddress: new web3.PublicKey(byMint.mint)
    })
    console.log(`\x1b[32muse:\x1b[0m ${JSON.stringify(usedNft, null, 2)}\n`)

    // Print Nft
    let printedNft = await metaplex.nfts().printNewEdition({
        originalMint: new web3.PublicKey(byMint.mint)
    }
    )
    console.log(`\x1b[32mprintNewEdition:\x1b[0m ${JSON.stringify(printedNft, null, 2)}\n`)




}