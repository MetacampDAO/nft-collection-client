import * as web3 from '@solana/web3.js'
import * as fs from 'fs'
// import { ethers } from 'ethers'

import dotenv from 'dotenv'
dotenv.config()

// Initialize Keypair for SOL
export let initializeSolSignerKeypair = (): web3.Keypair => {
    if (!process.env.PRIVATE_KEY) {
        console.log('Creating SOL keypair in .env file')
        const signer = web3.Keypair.generate()
        console.log(`Created SOL Public Key: ${signer.publicKey}`)

        // Append the new key-value pair to the contents of the .env file
        let envFileContents
        try {
            envFileContents = fs.readFileSync('.env', 'utf-8')!;
        } catch {
            console.log("No .env found.")
        }
        envFileContents = `PRIVATE_KEY=[${signer.secretKey.toString()}]\n`;
        fs.writeFileSync('.env', envFileContents)

        return signer
    }
    
    const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[]
    const secretKey = Uint8Array.from(secret)
    const keypairFromSecretKey = web3.Keypair.fromSecretKey(secretKey)
    console.log(`Current SOL Public Key: ${keypairFromSecretKey.publicKey}`)

    return keypairFromSecretKey
}

export let airdropSolIfNeeded = async (connection: web3.Connection, pubkey: web3.PublicKey, amount: number, threshold: number) => {

    if (connection.rpcEndpoint.includes('dev') || connection.rpcEndpoint.includes('test')) {
        const balance = await connection.getBalance(pubkey)
        console.log('Current balance is', balance / web3.LAMPORTS_PER_SOL, ' SOL')
        if (balance < threshold * web3.LAMPORTS_PER_SOL) {
            console.log(`Airdropping ${amount} SOL...`)
            await connection.requestAirdrop(pubkey, amount * web3.LAMPORTS_PER_SOL)
            console.log(`\rAirdrop of ${amount} SOL was successful.`)
        }
    } 
    
    console.log(`Selected cluster: ${connection.rpcEndpoint}`)
    console.log('\n');

}

let convertUint8ArrayToHex = (uint8Array: Uint8Array): string => {
    // Convert each byte to its corresponding two-digit hex representation
    const hexArray = Array.from(uint8Array, byte => ('0' + byte.toString(16)).slice(-2));
    // Join the hex values into a single string
    const hexString = hexArray.join('');
    return hexString;
}

// export let initializeEthSignerKeypair = (): ethers.Signer => {
//     if (!process.env.PRIVATE_KEY_ETH) {
//         console.log('Creating ETH signer in .env file')
//         const privateKeyEth = "0x" + convertUint8ArrayToHex(web3.Keypair.generate().secretKey).substring(0, 64);
//         const signer = new ethers.Wallet(privateKeyEth);
//         console.log(`Created ETH Public Key: ${signer.address}`)

//         // Append the new key-value pair to the contents of the .env file
//         let envFileContents = fs.readFileSync('.env', 'utf-8');
//         envFileContents += `PRIVATE_KEY_ETH=${privateKeyEth}\n`;
//         fs.writeFileSync('.env', envFileContents)

//         return signer
//     }
    
//     const privateKeyEth = process.env.PRIVATE_KEY_ETH
//     const signer = new ethers.Wallet(privateKeyEth);
//     console.log(`Current ETH Public Key: ${signer.address}`)

//     return signer
// }