import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contract";

const HARDHAT_CHAIN_ID = 31337n;
const HARDHAT_CHAIN_ID_HEX = "0x7A69";
const HARDHAT_NETWORK_PARAMS = {
  chainId: HARDHAT_CHAIN_ID_HEX,
  chainName: "Hardhat Local",
  rpcUrls: ["http://127.0.0.1:8545"],
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  }
};
const HARDHAT_RPC_URL = HARDHAT_NETWORK_PARAMS.rpcUrls[0];

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #dbe3f0",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "16px",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)"
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: "10px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1"
};

const buttonStyle = {
  padding: "10px 14px",
  border: "none",
  borderRadius: "8px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer"
};

function App() {
  const [account, setAccount] = useState("");
  const [walletBalance, setWalletBalance] = useState("0.0000");
  const [networkLabel, setNetworkLabel] = useState("Not connected");
  const [contract, setContract] = useState(null);
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Connect MetaMask to Hardhat Local.");
  const [verifyResult, setVerifyResult] = useState("");

  const [registerForm, setRegisterForm] = useState({
    landId: "",
    owner: "",
    location: ""
  });

  const [transferForm, setTransferForm] = useState({
    landId: "",
    newOwner: ""
  });

  const [verifyForm, setVerifyForm] = useState({
    landId: "",
    owner: ""
  });

  const getErrorMessage = (error) => {
    if (error?.code === 4001) {
      return "MetaMask request was rejected.";
    }

    if (error?.message?.includes("network does not support ENS")) {
      return "Enter a valid Ethereum address starting with 0x.";
    }

    if (error?.message?.includes("could not decode result data")) {
      return "Contract not found on the selected network. Switch MetaMask to Hardhat Local, keep `npm run node` running, and run `npm run deploy` again.";
    }

    if (error?.message?.toLowerCase().includes("insufficient funds")) {
      return "Connected wallet has 0 ETH on Hardhat Local. Import one of the funded accounts printed by `npm run node` into MetaMask.";
    }

    if (error?.reason) {
      return error.reason;
    }

    if (error?.shortMessage) {
      return error.shortMessage;
    }

    return error?.message || "Something went wrong.";
  };

  const resetContractState = () => {
    setContract(null);
    setLands([]);
    setWalletBalance("0.0000");
    setVerifyResult("");
  };

  const getProvider = () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }

    return new ethers.BrowserProvider(window.ethereum);
  };

  const getRpcProvider = () => {
    return new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
  };

  const setCurrentNetwork = async (provider) => {
    const network = await provider.getNetwork();
    setNetworkLabel(`Chain ID: ${network.chainId.toString()}`);
    return network;
  };

  const formatBalance = (balance) => {
    return Number.parseFloat(ethers.formatEther(balance)).toFixed(4);
  };

  const setWalletDetails = async (provider, signerAddress) => {
    const balance = await provider.getBalance(signerAddress);

    setAccount(signerAddress);
    setWalletBalance(formatBalance(balance));

    setRegisterForm((currentForm) => {
      if (currentForm.owner.trim()) {
        return currentForm;
      }

      return { ...currentForm, owner: signerAddress };
    });

    setVerifyForm((currentForm) => {
      if (currentForm.owner.trim()) {
        return currentForm;
      }

      return { ...currentForm, owner: signerAddress };
    });

    return balance;
  };

  const ensureContractIsDeployed = async (provider) => {
    const code = await provider.getCode(CONTRACT_ADDRESS);

    if (code === "0x") {
      throw new Error("No LandRegistry contract is deployed on Hardhat Local. Keep `npm run node` running and run `npm run deploy` again.");
    }
  };

  const getRequiredLandId = (value) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      throw new Error("Land ID is required.");
    }

    return trimmedValue;
  };

  const getRequiredText = (value, label) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      throw new Error(`${label} is required.`);
    }

    return trimmedValue;
  };

  const getValidAddress = (value, label) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      throw new Error(`${label} is required.`);
    }

    if (!ethers.isAddress(trimmedValue)) {
      throw new Error(`${label} must be a valid Ethereum address starting with 0x.`);
    }

    return ethers.getAddress(trimmedValue);
  };

  const ensureWalletHasFunds = async (provider, signerAddress) => {
    const balance = await provider.getBalance(signerAddress);
    setWalletBalance(formatBalance(balance));

    if (balance === 0n) {
      throw new Error("Connected wallet has 0 ETH on Hardhat Local. Import one of the funded accounts printed by `npm run node` into MetaMask.");
    }
  };

  const switchToHardhatNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID_HEX }]
      });
    } catch (error) {
      if (error.code !== 4902) {
        throw error;
      }

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [HARDHAT_NETWORK_PARAMS]
      });
    }
  };

  const validateConnection = async (provider) => {
    if (!CONTRACT_ADDRESS || CONTRACT_ABI.length === 0) {
      throw new Error("Deploy the contract first so the frontend receives the ABI and address.");
    }

    const network = await setCurrentNetwork(provider);

    if (network.chainId !== HARDHAT_CHAIN_ID) {
      throw new Error("Switch MetaMask to Hardhat Local (Chain ID 31337).");
    }
    
    await ensureContractIsDeployed(provider);
  };

  const getReadContract = async () => {
    const provider = getRpcProvider();
    await ensureContractIsDeployed(provider);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  };

  const buildContract = async () => {
    const provider = getProvider();
    await validateConnection(provider);

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const registryContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    await setWalletDetails(provider, signerAddress);
    setContract(registryContract);

    return registryContract;
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus("MetaMask is not installed.");
        return;
      }

      setLoading(true);
      await switchToHardhatNetwork();
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await buildContract();
      setStatus("Wallet connected to Hardhat Local.");
      await fetchAllLands();
    } catch (error) {
      setStatus(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLands = async () => {
    try {
      setLoading(true);
      const registryContract = await getReadContract();
      const result = await registryContract.getAllLands();

      const formattedLands = result.map((land) => ({
        id: land.id.toString(),
        owner: land.owner,
        location: land.location
      }));

      setLands(formattedLands);
      setStatus("Fetched all lands.");
    } catch (error) {
      setStatus(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const registerLand = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const provider = getProvider();
      await validateConnection(provider);

      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      await ensureWalletHasFunds(provider, signerAddress);

      const registryContract =
        contract || new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const landId = getRequiredLandId(registerForm.landId);
      const owner = getValidAddress(registerForm.owner, "Owner address");
      const location = getRequiredText(registerForm.location, "Location");

      const tx = await registryContract.registerLand(landId, owner, location);

      await tx.wait();
      setStatus("Land registered successfully.");
      setRegisterForm({ landId: "", owner: signerAddress, location: "" });
      await fetchAllLands();
    } catch (error) {
      setStatus(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const transferLand = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const provider = getProvider();
      await validateConnection(provider);

      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      await ensureWalletHasFunds(provider, signerAddress);

      const registryContract =
        contract || new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const landId = getRequiredLandId(transferForm.landId);
      const newOwner = getValidAddress(transferForm.newOwner, "New owner address");

      const tx = await registryContract.transferLand(landId, newOwner);

      await tx.wait();
      setStatus("Ownership transferred successfully.");
      setTransferForm({ landId: "", newOwner: "" });
      await fetchAllLands();
    } catch (error) {
      setStatus(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const verifyOwnership = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const registryContract = await getReadContract();
      const landId = getRequiredLandId(verifyForm.landId);
      const owner = getValidAddress(verifyForm.owner, "Owner address");
      const isOwner = await registryContract.verifyOwnership(landId, owner);

      setVerifyResult(isOwner ? "Ownership verified." : "Ownership does not match.");
      setStatus("Ownership check complete.");
    } catch (error) {
      setStatus(getErrorMessage(error));
      setVerifyResult("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) {
      return undefined;
    }

    const syncWallet = async () => {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        const provider = getProvider();
        await setCurrentNetwork(provider);

        if (accounts.length === 0) {
          setAccount("");
          resetContractState();
          setStatus("Connect MetaMask to Hardhat Local.");
          return;
        }

        await setWalletDetails(provider, accounts[0]);

        if (CONTRACT_ADDRESS) {
          await buildContract();
          await fetchAllLands();
        }
      } catch (error) {
        resetContractState();
        setStatus(getErrorMessage(error));
      }
    };

    const handleAccountsChanged = (accounts) => {
      resetContractState();

      if (accounts.length === 0) {
        setAccount("");
        setStatus("Connect MetaMask to Hardhat Local.");
        return;
      }

      syncWallet();
    };

    const handleChainChanged = () => {
      resetContractState();
      syncWallet();
    };

    syncWallet();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ marginTop: 0 }}>Blockchain-Enabled Land Authority</h1>
      <p>Connected account: {account || "Not connected"}</p>
      <p>Wallet network: {networkLabel}</p>
      <p>Wallet balance: {walletBalance} ETH</p>

      <div style={cardStyle}>
        <button style={buttonStyle} onClick={connectWallet} disabled={loading}>
          {loading ? "Please wait..." : "Connect MetaMask"}
        </button>
        <p style={{ marginTop: "12px", marginBottom: 0 }}>{status}</p>
        {account && walletBalance === "0.0000" && (
          <p style={{ marginTop: "12px", marginBottom: 0, color: "#b45309" }}>
            This wallet has no ETH on Hardhat Local. Import one of the funded accounts shown by
            `npm run node` before sending transactions.
          </p>
        )}
      </div>

      <form onSubmit={registerLand} style={cardStyle}>
        <h2>Register Land</h2>
        <input
          style={inputStyle}
          type="number"
          placeholder="Land ID"
          value={registerForm.landId}
          onChange={(event) =>
            setRegisterForm({ ...registerForm, landId: event.target.value })
          }
          required
        />
        <input
          style={inputStyle}
          type="text"
          placeholder="Owner Address"
          value={registerForm.owner}
          onChange={(event) =>
            setRegisterForm({ ...registerForm, owner: event.target.value })
          }
          required
        />
        <input
          style={inputStyle}
          type="text"
          placeholder="Location"
          value={registerForm.location}
          onChange={(event) =>
            setRegisterForm({ ...registerForm, location: event.target.value })
          }
          required
        />
        <button style={buttonStyle} type="submit" disabled={loading}>
          Register Land
        </button>
      </form>

      <form onSubmit={transferLand} style={cardStyle}>
        <h2>Transfer Ownership</h2>
        <input
          style={inputStyle}
          type="number"
          placeholder="Land ID"
          value={transferForm.landId}
          onChange={(event) =>
            setTransferForm({ ...transferForm, landId: event.target.value })
          }
          required
        />
        <input
          style={inputStyle}
          type="text"
          placeholder="New Owner Address"
          value={transferForm.newOwner}
          onChange={(event) =>
            setTransferForm({ ...transferForm, newOwner: event.target.value })
          }
          required
        />
        <button style={buttonStyle} type="submit" disabled={loading}>
          Transfer Land
        </button>
      </form>

      <form onSubmit={verifyOwnership} style={cardStyle}>
        <h2>Verify Ownership</h2>
        <input
          style={inputStyle}
          type="number"
          placeholder="Land ID"
          value={verifyForm.landId}
          onChange={(event) =>
            setVerifyForm({ ...verifyForm, landId: event.target.value })
          }
          required
        />
        <input
          style={inputStyle}
          type="text"
          placeholder="Owner Address"
          value={verifyForm.owner}
          onChange={(event) =>
            setVerifyForm({ ...verifyForm, owner: event.target.value })
          }
          required
        />
        <button style={buttonStyle} type="submit" disabled={loading}>
          Verify Owner
        </button>
        {verifyResult && <p style={{ marginBottom: 0 }}>{verifyResult}</p>}
      </form>

      <div style={cardStyle}>
        <h2>All Lands</h2>
        <button style={buttonStyle} onClick={fetchAllLands} disabled={loading}>
          Fetch All Lands
        </button>

        {lands.length === 0 ? (
          <p>No lands registered yet.</p>
        ) : (
          <div style={{ marginTop: "16px" }}>
            {lands.map((land) => (
              <div
                key={land.id}
                style={{
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  marginBottom: "10px"
                }}
              >
                <p style={{ margin: "0 0 6px" }}><strong>ID:</strong> {land.id}</p>
                <p style={{ margin: "0 0 6px" }}><strong>Owner:</strong> {land.owner}</p>
                <p style={{ margin: 0 }}><strong>Location:</strong> {land.location}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
