import "./App.css";
import * as chains from "viem/chains";
import { createPublicClient, http, Chain } from "viem";
import { useEffect, useState } from "react";

interface ChainResult {
  chain: Chain;
  supported: boolean | null;
  loading: boolean;
  error?: string;
}

async function checkChain(chain: Chain): Promise<boolean> {
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0], {
      timeout: 2000,
    }),
  });

  try {
    const params = [
      {
        from: "0xdeadbeef00000000000000000000000000000000",
        to: "0xdeadbeef00000000000000000000000000000000",
        data:
          "0x0000000000000000000000000000000000000000000000000000000000000000" +
          "0000000000000000000000000000000000000000000000000000000000000001" +
          "0000000000000000000000000000000000000000000000000000000000000000" +
          "0000000000000000000000000000000000000000000000000000000000000000",
        value: "0x0",
      },
      "latest",
      {
        "0xdeadbeef00000000000000000000000000000000": {
          code: "0xef01000000000000000000000000000000000000000001",
        },
      },
    ] as any;
    await client.request({
      method: "eth_estimateGas",
      params,
    });
    return true;
  } catch (e: any) {
    return false;
  }
}

function App() {
  const prodChains = (Object.values(chains) as Chain[]).filter(
    (i) => !i.testnet
  );

  const [results, setResults] = useState<Record<string, ChainResult>>(() => {
    const initialResults: Record<string, ChainResult> = {};
    prodChains.forEach((chain) => {
      initialResults[chain.id.toString()] = {
        chain,
        supported: null,
        loading: true,
      };
    });
    return initialResults;
  });

  useEffect(() => {
    prodChains.forEach((chain) => {
      checkChain(chain)
        .then((supported) => {
          setResults((prev) => ({
            ...prev,
            [chain.id.toString()]: {
              chain,
              supported,
              loading: false,
            },
          }));
        })
        .catch((error) => {
          setResults((prev) => ({
            ...prev,
            [chain.id.toString()]: {
              chain,
              supported: false,
              loading: false,
              error: error.message,
            },
          }));
        });
    });
  }, [prodChains]);

  const totalChains = Object.keys(results).length;
  const checkedChains = Object.values(results).filter((r) => !r.loading).length;
  const supportedChains = Object.values(results).filter(
    (r) => r.supported === true
  ).length;

  const sortedResults = Object.values(results).sort((a, b) => {
    if (a.chain.id !== b.chain.id) {
      return a.chain.id - b.chain.id;
    }
    if (a.loading && !b.loading) return -1;
    if (!a.loading && b.loading) return 1;
    if (a.loading && b.loading) return 0;

    if (a.supported === true && b.supported !== true) return -1;
    if (a.supported !== true && b.supported === true) return 1;

    return 0;
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>EIP-7702 Chain Support</h1>
        <div>
          We check support for EIP7702 by estimating gas for an authorization transaction, per: 
          https://medium.com/@Jingkangchua/how-to-quickly-verify-eip-7702-support-on-any-evm-chain-39975a08dcd4.
        </div>
        <div style={{ fontSize: "1.2em", margin: "10px 0" }}>
          Progress: {checkedChains} / {totalChains} chains checked
          {checkedChains > 0 && ` (${supportedChains} supported)`}
        </div>
      </header>
      <div style={{ padding: "20px" }}>
        {sortedResults.map((result) => (
          <div
            key={result.chain.id}
            style={{ padding: "10px", borderBottom: "1px solid #ccc" }}
          >
            <strong>{result.chain.name}</strong> (ID: {result.chain.id})
            {result.loading && <span> - Checking...</span>}
            {!result.loading && result.supported !== null && (
              <span style={{ color: result.supported ? "green" : "red" }}>
                {" - "}
                {result.supported ? "✓ Supported" : "✗ Not Supported"}
              </span>
            )}
            {result.error && (
              <div style={{ fontSize: "0.8em", color: "orange" }}>
                Error: {result.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
