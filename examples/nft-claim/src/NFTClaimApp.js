import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useCallback } from 'react';
import { Connection, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { GaslessSDK } from '@gasless-infra/sdk';
import toast, { Toaster } from 'react-hot-toast';
import '@solana/wallet-adapter-react-ui/styles.css';
// === CONFIG ===
const endpoint = 'https://api.devnet.solana.com:'; // solana-test-validator
const apiUrl = import.meta.env.VITE_GASLESS_API_URL;
const serviceId = import.meta.env.VITE_GASLESS_SERVICE_ID;
if (!apiUrl) {
    throw new Error('VITE_GASLESS_API_URL no está definido en .env');
}
if (!serviceId) {
    throw new Error('VITE_GASLESS_SERVICE_ID no está definido en .env');
}
// Instrucción dummy (válida pero “no-op”) contra SystemProgram
function buildDummyIx(payer) {
    return new TransactionInstruction({
        programId: SystemProgram.programId,
        keys: [{ pubkey: payer, isSigner: false, isWritable: false }],
        data: Buffer.from([]),
    });
}
export default function NFTClaimApp() {
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
    const connection = useMemo(() => new Connection(endpoint, 'confirmed'), []);
    const [sdk] = useState(() => new GaslessSDK({ apiUrl, serviceId }));
    return (_jsx(ConnectionProvider, { endpoint: endpoint, children: _jsx(WalletProvider, { wallets: wallets, autoConnect: true, children: _jsxs(WalletModalProvider, { children: [_jsxs("div", { style: { padding: 24, fontFamily: 'system-ui, sans-serif' }, children: [_jsx("h1", { style: { fontSize: 40, marginBottom: 8 }, children: "\uD83C\uDFA8 NFT Claim Example" }), _jsxs("p", { style: { margin: '8px 0' }, children: ["RPC: ", _jsx("code", { children: endpoint }), _jsx("br", {}), "API: ", _jsx("code", { children: apiUrl }), _jsx("br", {}), "Service ID: ", _jsx("code", { children: serviceId })] }), _jsx("div", { style: { margin: '16px 0' }, children: _jsx(WalletMultiButton, {}) }), _jsx(ClaimSection, { sdk: sdk })] }), _jsx(Toaster, { position: "top-right", toastOptions: { duration: 4000 } })] }) }) }));
}
function ClaimSection({ sdk }) {
    const { wallet, publicKey } = useWallet();
    const onClaim = useCallback(async () => {
        try {
            if (!wallet?.adapter || !publicKey) {
                throw new Error('Conecta tu wallet primero');
            }
            // Nos aseguramos de que el adapter soporte signMessage
            const adapter = wallet.adapter;
            if (typeof adapter.signMessage !== 'function') {
                throw new Error('Tu wallet no soporta signMessage (requisito para permits)');
            }
            const ix = buildDummyIx(publicKey);
            const permit = await sdk.createPermit(adapter, ix, {
                expiry: Math.floor(Date.now() / 1000) + 15 * 60, // 15 min
                maxFee: 5000000, // 0.005 SOL
            });
            toast.success(`Permit creado (nonce ${permit.nonce})`);
            // Si quieres esperar ejecución:
            // const executed = await sdk.waitForExecution(permit.permitId, { timeout: 60_000 })
            // toast.success(`Ejecutado: ${executed.transactionSignature}`)
        }
        catch (e) {
            console.error(e);
            toast.error(e?.message ?? 'Error al crear el permit');
        }
    }, [wallet, publicKey, sdk]);
    if (!publicKey) {
        return _jsx("p", { children: "Conecta tu wallet para continuar." });
    }
    return (_jsxs("div", { style: { marginTop: 12 }, children: [_jsxs("p", { children: ["Wallet: ", publicKey.toBase58()] }), _jsx("button", { onClick: onClaim, style: {
                    marginTop: 8,
                    padding: '10px 16px',
                    fontSize: 16,
                    borderRadius: 8,
                    cursor: 'pointer',
                }, children: "\uD83D\uDE80 Claim NFT (permit)" })] }));
}
