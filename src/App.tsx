import "./App.css";
import * as chains from "viem/chains";
import { Chain } from "viem";
import { useEffect, useState } from "react";
import { check7702 } from "./checks/7702";
import { check1559 } from "./checks/1559";

const PROD_CHAINS = (Object.values(chains) as Chain[]).filter(
  (i) => !i.testnet
);
interface ChainResult {
  chain: Chain;
  eip_1559_supported: boolean | null;
  eip_1559_loading: boolean;
  eip_7702_supported: boolean | null;
  eip_7702_loading: boolean;
  error?: string;
}

type SortColumn = "name" | "chainId" | "eip1559" | "eip7702";
type SortDirection = "asc" | "desc";

function App() {
  const [results, setResults] = useState<Record<string, ChainResult>>(() => {
    const initialResults: Record<string, ChainResult> = {};
    PROD_CHAINS.forEach((chain) => {
      initialResults[chain.id.toString()] = {
        chain,
        eip_1559_supported: null,
        eip_1559_loading: true,
        eip_7702_supported: null,
        eip_7702_loading: true,
      };
    });
    return initialResults;
  });

  const [sortColumn, setSortColumn] = useState<SortColumn>("chainId");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    PROD_CHAINS.forEach((chain) => {
      // Check EIP-1559
      (async () => {
        try {
          const supported = await check1559(chain);
          setResults((prev) => ({
            ...prev,
            [chain.id.toString()]: {
              ...prev[chain.id.toString()],
              eip_1559_supported: supported,
              eip_1559_loading: false,
            },
          }));
        } catch (error: any) {
          setResults((prev) => ({
            ...prev,
            [chain.id.toString()]: {
              ...prev[chain.id.toString()],
              eip_1559_supported: false,
              eip_1559_loading: false,
              error: error.message,
            },
          }));
        }
      })();

      // Check EIP-7702
      (async () => {
        try {
          const supported = await check7702(chain);
          setResults((prev) => ({
            ...prev,
            [chain.id.toString()]: {
              ...prev[chain.id.toString()],
              eip_7702_supported: supported,
              eip_7702_loading: false,
            },
          }));
        } catch (error: any) {
          setResults((prev) => ({
            ...prev,
            [chain.id.toString()]: {
              ...prev[chain.id.toString()],
              eip_7702_supported: false,
              eip_7702_loading: false,
              error: error.message,
            },
          }));
        }
      })();
    });
  }, []);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedResults = Object.values(results).sort((a, b) => {
    let compareValue = 0;

    switch (sortColumn) {
      case "name":
        compareValue = a.chain.name.localeCompare(b.chain.name);
        break;
      case "chainId":
        compareValue = a.chain.id - b.chain.id;
        break;
      case "eip1559":
        // Sort by: supported first, then loading, then errors
        if (a.eip_1559_supported === true && b.eip_1559_supported !== true)
          compareValue = -1;
        else if (a.eip_1559_supported !== true && b.eip_1559_supported === true)
          compareValue = 1;
        else if (a.eip_1559_loading && !b.eip_1559_loading) compareValue = -1;
        else if (!a.eip_1559_loading && b.eip_1559_loading) compareValue = 1;
        else if (!!a.error && !b.error) compareValue = 1;
        else if (!a.error && !!b.error) compareValue = -1;
        break;
      case "eip7702":
        // Sort by: supported first, then loading, then errors
        if (a.eip_7702_supported === true && b.eip_7702_supported !== true)
          compareValue = -1;
        else if (a.eip_7702_supported !== true && b.eip_7702_supported === true)
          compareValue = 1;
        else if (a.eip_7702_loading && !b.eip_7702_loading) compareValue = -1;
        else if (!a.eip_7702_loading && b.eip_7702_loading) compareValue = 1;
        else if (!!a.error && !b.error) compareValue = 1;
        else if (!a.error && !!b.error) compareValue = -1;
        break;
    }
    return sortDirection === "asc" ? compareValue : -compareValue;
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-3xl font-bold mb-2">EIP Scanner</h1>
        <div className="text-base mb-4">Scan EVM chains for EIP-1559 and EIP-7702 support.</div>
        <h2 className="text-xl font-semibold mt-4">EIP-1559</h2>
        <div className="text-sm mb-3">Checks for base fee support via eth_getBlockByNumber and eth_feeHistory.</div>
        <h2 className="text-xl font-semibold mt-2">EIP-7702</h2>
        <div className="text-sm mb-1">
          https://medium.com/@Jingkangchua/how-to-quickly-verify-eip-7702-support-on-any-evm-chain-39975a08dcd4
        </div>
        <div className="text-sm text-yellow-100">
          Warning: There seems to be false positives (like HypeEVM) that pass
          this check.
        </div>
      </header>
      <div className="p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-200 bg-opacity-10">
              <th
                className="p-3 text-left cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Name{" "}
                {sortColumn === "name" && (sortDirection === "asc" ? "↓" : "↑")}
              </th>
              <th
                className="p-3 text-left cursor-pointer"
                onClick={() => handleSort("chainId")}
              >
                Chain ID{" "}
                {sortColumn === "chainId" &&
                  (sortDirection === "asc" ? "↓" : "↑")}
              </th>
              <th
                className="p-3 text-left cursor-pointer"
                onClick={() => handleSort("eip1559")}
              >
                EIP-1559{" "}
                {sortColumn === "eip1559" &&
                  (sortDirection === "asc" ? "↓" : "↑")}
              </th>
              <th
                className="p-3 text-left cursor-pointer"
                onClick={() => handleSort("eip7702")}
              >
                EIP-7702{" "}
                {sortColumn === "eip7702" &&
                  (sortDirection === "asc" ? "↓" : "↑")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result) => (
              <tr key={result.chain.id} className="border-b border-gray-300">
                <td className="p-3">{result.chain.name}</td>
                <td className="p-3">{result.chain.id}</td>
                <td className="p-3">
                  {result.eip_1559_loading && (
                    <span className="text-gray-500">Checking...</span>
                  )}
                  {!result.eip_1559_loading &&
                    result.eip_1559_supported !== null && (
                      <span
                        className={
                          result.eip_1559_supported
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {result.eip_1559_supported
                          ? "✓ Supported"
                          : "✗ Not Supported"}
                      </span>
                    )}
                </td>
                <td className="p-3">
                  {result.eip_7702_loading && (
                    <span className="text-gray-500">Checking...</span>
                  )}
                  {!result.eip_7702_loading &&
                    result.eip_7702_supported !== null && (
                      <span
                        className={
                          result.eip_7702_supported
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {result.eip_7702_supported
                          ? "✓ Supported"
                          : "✗ Not Supported"}
                      </span>
                    )}
                  {result.error && (
                    <div className="text-sm text-orange-500">
                      Error: {result.error}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
