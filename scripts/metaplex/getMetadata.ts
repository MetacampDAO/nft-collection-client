/**
 * This blob of a file is pulled together from different files from the metaplex
 * repository.
 * Metaplex does not have a NPM package at the current time to make this easier, so instead of
 * trying to reference their stuff, I copied all of the minimum necessary code into this file
 */
import { BinaryReader, BinaryWriter, deserializeUnchecked } from "borsh";
import { PublicKey, Connection } from "@solana/web3.js";
import base58 from "bs58";
import { updateJsonFile, readOrCreateFile } from "../readOrCreateJsonFile"
// import { CollectionDetails, ProgrammableConfig } from "@metaplex-foundation/mpl-token-metadata";


export const METADATA_PROGRAM_ID =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s" as StringPublicKey;
export const METADATA_PREFIX = "metadata";


// Borsh extension for pubkey stuff
(BinaryReader.prototype as any).readPubkey = function () {
  const reader = this as unknown as BinaryReader;
  const array = reader.readFixedArray(32);
  return new PublicKey(array);
};

(BinaryWriter.prototype as any).writePubkey = function (value: PublicKey) {
  const writer = this as unknown as BinaryWriter;
  writer.writeFixedArray(value.toBuffer());
};

(BinaryReader.prototype as any).readPubkeyAsString = function () {
  const reader = this as unknown as BinaryReader;
  const array = reader.readFixedArray(32);
  return base58.encode(array) as StringPublicKey;
};

(BinaryWriter.prototype as any).writePubkeyAsString = function (
  value: StringPublicKey
) {
  const writer = this as unknown as BinaryWriter;
  writer.writeFixedArray(base58.decode(value));
};



export type StringPublicKey = string;

export enum TokenStandard {
    NonFungible = 0,
    FungibleAsset = 1,
    Fungible = 2,
    NonFungibleEdition = 3,
    ProgrammableNonFungible = 4
}

export enum MetadataKey {
    Uninitialized = 0,
    EditionV1 = 1,
    MasterEditionV1 = 2,
    ReservationListV1 = 3,
    MetadataV1 = 4,
    ReservationListV2 = 5,
    MasterEditionV2 = 6,
    EditionMarker = 7,
    UseAuthorityRecord = 8,
    CollectionAuthorityRecord = 9,
    TokenOwnedEscrow = 10,
    TokenRecord = 11,
    MetadataDelegate = 12
}

export enum UseMethod {
    Burn = 0,
    Multiple = 1,
    Single = 2
}


class Collection {
    verified: boolean;
    key: StringPublicKey;
    constructor(args: {
        verified: boolean;
        key: StringPublicKey;
      }) {
        this.verified = args.verified;
        this.key = args.key;
      }
}

class Uses {
    useMethod: UseMethod;
    remaining: number;
    total: number;    
    constructor(args: {
        useMethod: UseMethod;
        remaining: number;
        total: number;
      }) {
        this.useMethod = args.useMethod;
        this.remaining = args.remaining;
        this.total = args.total
      }
};


class ProgrammableConfig {
    V1: {
        ruleSet: StringPublicKey;
    };
    constructor(args: { V1: { 
        ruleSet: StringPublicKey;
    }
      }) {
        this.V1 = args.V1;
      }
};

class CollectionDetails {
    V1: {
        size: number;
    };
    constructor(args: { V1: { 
        size: number;
    }
      }) {
        this.V1 = args.V1;
      }
}

class Creator {
  address: StringPublicKey;
  verified: boolean;
  share: number;

  constructor(args: {
    address: StringPublicKey;
    verified: boolean;
    share: number;
  }) {
    this.address = args.address;
    this.verified = args.verified;
    this.share = args.share;
  }
}

class Data {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Creator[] | null;
  constructor(args: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Creator[] | null;
  }) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
    this.creators = args.creators;
  }
}

export class Metadata {
  key: MetadataKey;
  updateAuthority: StringPublicKey;
  mint: StringPublicKey;
  data: Data;
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: number | null;
  tokenStandard: TokenStandard;
  collection: Collection;
  uses: Uses;
  collectionDetails: CollectionDetails;
  programmableConfig: ProgrammableConfig;

  // set lazy
  masterEdition?: StringPublicKey;
  edition?: StringPublicKey;

  constructor(args: {
    updateAuthority: StringPublicKey;
    mint: StringPublicKey;
    data: Data;
    primarySaleHappened: boolean;
    isMutable: boolean;
    editionNonce: number | null;
    tokenStandard: TokenStandard;
    collection: Collection;
    uses: Uses;
    collectionDetails: CollectionDetails;
    programmableConfig: ProgrammableConfig;
  }) {
    this.key = MetadataKey.MetadataV1;
    this.updateAuthority = args.updateAuthority;
    this.mint = args.mint;
    this.data = args.data;
    this.primarySaleHappened = args.primarySaleHappened;
    this.isMutable = args.isMutable;
    this.editionNonce = args.editionNonce;  
    this.tokenStandard = args.tokenStandard;
    this.collection = args.collection;
    this.uses = args.uses;
    this.collectionDetails = args.collectionDetails;
    this.programmableConfig = args.programmableConfig;
  }
}

const METADATA_SCHEMA = new Map<any, any>([
    [
        Collection,
        {
            kind: "struct",
            fields: [
                ["verified", "u8"],
                ["key", "pubkeyAsString"]
            ]
        },
    ],
    [
        Uses,
        {
            kind: "struct",
            fields: [
                ["useMethod", "u8"],
                ["remaining", "u64"],
                ["total", "u64"]
            ]
        },
    ],
    [
        Data,
        {
        kind: "struct",
        fields: [
            ["name", "string"],
            ["symbol", "string"],
            ["uri", "string"],
            ["sellerFeeBasisPoints", "u16"],
            ["creators", { kind: "option", type: [Creator] }],
        ],
        },
    ],
    [
        Creator,
        {
        kind: "struct",
        fields: [
            ["address", "pubkeyAsString"],
            ["verified", "u8"],
            ["share", "u8"],
        ],
        },
    ],
    [ CollectionDetails, 
      {
        kind: "struct",
        fields: [
          [ "size", "u64"]
        ]
      }
    ],
    [ ProgrammableConfig, 
      {
        kind: "struct",
        fields: [
          [ "ruleSet", "pubkeyAsString"]
        ]
      }
    ],
    [
        Metadata,
        {
        kind: "struct",
        fields: [
            ["key", "u8"],
            ["updateAuthority", "pubkeyAsString"],
            ["mint", "pubkeyAsString"],
            ["data", Data],
            ["primarySaleHappened", "u8"], //bool
            ["isMutable", "u8"], //bool
            ["editionNonce", { kind : "option", type: "u8" }], 
            ["tokenStandard", { kind : "option", type: "u8" }],
            ["collection", { kind : "option", type: Collection }],
            ["uses", { kind : "option", type: Uses }],
            ["collectionDetails", { kind : "option", type: CollectionDetails }], 
            ["programmableConfig", { kind : "option", type: ProgrammableConfig }]
        ],
        },
    ],
]);


const METADATA_REPLACE = new RegExp("\u0000", "g");
export const decodeMetadata = (buffer: Buffer): Metadata => {
  const metadata = deserializeUnchecked(
    METADATA_SCHEMA,
    Metadata,
    buffer
  ) as Metadata;

  metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, "");
  metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, "");
  metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, "");
 
  return metadata;
};

export async function getMetadata(
  connection: Connection,
  pubKey: PublicKey,
  directoryPath: string,
  addressFieldName: string,
  metadataFieldName: string,
  batchSize: number = 100,
  skip?: boolean
    ) : Promise<Metadata[]> {


    // Console log progress
    let timeLabel = 'getMetadata'
    console.time(timeLabel);
    let counter = 0;

    // Define inputs
    let metadataAccounts : string[] = (await readOrCreateFile(`${pubKey}.json`, directoryPath))[`${addressFieldName}`]
    if (!metadataAccounts) { metadataAccounts = [] }
    let metadataArray : Metadata[] = (await readOrCreateFile(`${pubKey}.json`, directoryPath))[`${metadataFieldName}`]
    if (!metadataArray) { metadataArray = [] }

    // Check if skipping
    if (!skip) {

      // Check if transactions exist
      while (metadataArray.length < metadataAccounts.length || (!Array.isArray(metadataArray) || metadataArray.length == 0 || metadataArray.every(item => item === null))) {

        let batch : PublicKey[] = metadataAccounts.slice(metadataArray.length, metadataArray.length + batchSize).map( account => new PublicKey(account) )
        let accInfoArray = await connection.getMultipleAccountsInfo(batch)
       
        
        for (let accInfo of accInfoArray) {

          // Handling undefined value in data
          if (accInfo?.data! === undefined) {
            continue
          }

          // Decode metadata from data field
          let newMetadata = decodeMetadata(accInfo?.data!)
          metadataArray.push(newMetadata)
        }
  
        updateJsonFile( directoryPath + `${pubKey}.json`, pubKey, `${metadataFieldName}`, metadataArray)
        process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${metadataArray.length}\x1b[0m/${metadataAccounts.length} Decoding metadata account(s) ...`)
      } 
      process.stdout.write(`\r\x1b[32m${['|', '/', '-', '\\'][counter++ % 4]} ${metadataArray.length}\x1b[0m/${metadataAccounts.length} Decoding metadata account(s) ...`)
    } 

    // Console log ending;
    console.timeEnd(timeLabel);
    console.log(`\r✅ Decoded ${metadataArray.length} metadata account(s)`)
    console.log('\n');

    


    return metadataArray
}

