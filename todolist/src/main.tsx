import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  WalletProvider,
  AllDefaultWallets,
  SuiDevnetChain,
  SuiTestnetChain,
  SuiMainnetChain,
  type Chain,
  SuietWallet,
} from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";

// Support multiple chains to avoid "unknown chain" issues
const supportedChains: Chain[] = [
  SuiDevnetChain,
  SuiTestnetChain,
  SuiMainnetChain,
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider
      defaultWallets={[...AllDefaultWallets, SuietWallet]}
      chains={supportedChains}
      autoConnect={true} // Optional: auto-connect to previously connected wallet
    >
      <App />
    </WalletProvider>
  </StrictMode>
);
