import "./App.css";
import * as chains from "viem/chains";
import { createPublicClient, http, Chain } from "viem";
import { useEffect, useState } from "react";

const PROD_CHAINS = (Object.values(chains) as Chain[]).filter(
  (i) => !i.testnet
);
const RPC_TIMEOUT = 2000;
interface ChainResult {
  chain: Chain;
  eip_7702_supported: boolean | null;
  loading: boolean;
  error?: string;
}

async function checkChain(chain: Chain): Promise<boolean> {
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0], {
      timeout: RPC_TIMEOUT,
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
  const [results, setResults] = useState<Record<string, ChainResult>>(() => {
    const initialResults: Record<string, ChainResult> = {};
    PROD_CHAINS.forEach((chain) => {
      initialResults[chain.id.toString()] = {
        chain,
        eip_7702_supported: null,
        loading: true,
      };
    });
    return initialResults;
  });

  useEffect(() => {
    PROD_CHAINS.forEach((chain) => {
      checkChain(chain)
        .then((supported) => {
          setResults((prev) => ({
            ...prev,
            [chain.id.toString()]: {
              chain,
              eip_7702_supported: supported,
              loading: false,
            },
          }));
        })
        .catch((error) => {
          setResults((prev) => ({
            ...prev,
            [chain.id.toString()]: {
              chain,
              eip_7702_supported: false,
              loading: false,
              error: error.message,
            },
          }));
        });
    });
  }, []);

  const sortedResults = Object.values(results).sort((a, b) => {
    if (a.eip_7702_supported === true && b.eip_7702_supported !== true)
      return -1;
    if (a.eip_7702_supported !== true && b.eip_7702_supported === true)
      return 1;
    if (a.loading && !b.loading) return -1;
    if (!a.loading && b.loading) return 1;
    const aHasError = !!a.error;
    const bHasError = !!b.error;
    if (aHasError && !bHasError) return 1;
    if (!aHasError && bHasError) return -1;
    return a.chain.id - b.chain.id;
  });

  return (
    <div className="App">
      <header className="App-header">
        <h2>EIP7702</h2>
        <div>
          https://medium.com/@Jingkangchua/how-to-quickly-verify-eip-7702-support-on-any-evm-chain-39975a08dcd4
        </div>
        <div>
          Warning: There seems to be false positives (like HypeEVM) that pass
          this check.
        </div>
      </header>
      <div className="p-5">
        {sortedResults.map((result) => (
          <div
            key={result.chain.id}
            className="p-2.5 border-b border-gray-300"
          >
            <strong>{result.chain.name}</strong> (ID: {result.chain.id})
            {result.loading && <span> - Checking...</span>}
            {!result.loading && result.eip_7702_supported !== null && (
              <span
                className={result.eip_7702_supported ? "text-green-600" : "text-red-600"}
              >
                {" - "}
                {result.eip_7702_supported ? "✓ Supported" : "✗ Not Supported"}
              </span>
            )}
            {result.error && (
              <div className="text-sm text-orange-500">
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
