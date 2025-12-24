import { Chain, createPublicClient, http } from "viem";

const RPC_TIMEOUT = 2000;

export async function check7702(chain: Chain): Promise<boolean> {
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
