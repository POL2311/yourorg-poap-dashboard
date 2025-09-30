import {PublicKey} from "@solana/web3.js";
import BN from "bn.js";

export const deriveGaslessProtocolPDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("gasless_protocol"),
        ],
        programId,
    )
};

export type ServiceProviderSeeds = {
    serviceId: string, 
};

export const deriveServiceProviderPDA = (
    seeds: ServiceProviderSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("service"),
            Buffer.from(seeds.serviceId, "utf8"),
        ],
        programId,
    )
};

export type UserPermitSeeds = {
    user: PublicKey, 
    service: PublicKey, 
    nonce: bigint, 
};

export const deriveUserPermitPDA = (
    seeds: UserPermitSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("permit"),
            seeds.user.toBuffer(),
            seeds.service.toBuffer(),
            Buffer.from(BigUint64Array.from([seeds.nonce]).buffer),
        ],
        programId,
    )
};

export type RelayerConfigSeeds = {
    relayer: PublicKey, 
};

export const deriveRelayerConfigPDA = (
    seeds: RelayerConfigSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("relayer"),
            seeds.relayer.toBuffer(),
        ],
        programId,
    )
};

export type FeeVaultSeeds = {
    service: PublicKey, 
};

export const deriveFeeVaultPDA = (
    seeds: FeeVaultSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("fee_vault"),
            seeds.service.toBuffer(),
        ],
        programId,
    )
};

export module CslSplTokenPDAs {
    export type AccountSeeds = {
        wallet: PublicKey, 
        tokenProgram: PublicKey, 
        mint: PublicKey, 
    };
    
    export const deriveAccountPDA = (
        seeds: AccountSeeds,
        programId: PublicKey
    ): [PublicKey, number] => {
        return PublicKey.findProgramAddressSync(
            [
                seeds.wallet.toBuffer(),
                seeds.tokenProgram.toBuffer(),
                seeds.mint.toBuffer(),
            ],
            programId,
        )
    };
    
}

export module CslSplAssocTokenPDAs {
    export module CslSplTokenPDAs {
        export type AccountSeeds = {
            wallet: PublicKey, 
            tokenProgram: PublicKey, 
            mint: PublicKey, 
        };
        
        export const deriveAccountPDA = (
            seeds: AccountSeeds,
            programId: PublicKey
        ): [PublicKey, number] => {
            return PublicKey.findProgramAddressSync(
                [
                    seeds.wallet.toBuffer(),
                    seeds.tokenProgram.toBuffer(),
                    seeds.mint.toBuffer(),
                ],
                programId,
            )
        };
        
    }
    
}

