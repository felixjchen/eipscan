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
        <div className="flex items-center justify-between w-full mb-2">
          <h1 className="text-3xl font-bold">EIP Scanner</h1>
          <a
            href="https://github.com/felixjchen/eipscan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-300 transition-colors"
            aria-label="View source on GitHub"
          >
            <svg height="32" viewBox="0 0 16 16" width="32" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
          </a>
        </div>
        <div className="text-base mb-4">
          Scan EVM chains for EIP-1559 and EIP-7702 support.
        </div>
        <h2 className="text-xl font-semibold mt-4">EIP-1559</h2>
        <div className="text-sm mb-3">
          Checks for base fee support via eth_getBlockByNumber and
          eth_feeHistory.
        </div>
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
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-700">
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
