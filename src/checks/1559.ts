import type { Chain } from "viem";
import { createPublicClient, http, hexToBigInt } from "viem";

export async function check1559(chain: Chain): Promise<boolean> {
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0], { timeout: 2000 }),
  });

  try {
    const block = await client.request({
      method: "eth_getBlockByNumber",
      params: ["latest", false],
    });

    if (!block?.baseFeePerGas) return false;

    const baseFee = hexToBigInt(block.baseFeePerGas);
    if (baseFee <= 0n) return false;

    const feeHistory = await client.request({
      method: "eth_feeHistory",
      params: ["0x4", "latest", [10, 50, 90]],
    });

    if (!feeHistory?.baseFeePerGas?.length) return false;
    return true;
  } catch {
    return false;
  }
}
