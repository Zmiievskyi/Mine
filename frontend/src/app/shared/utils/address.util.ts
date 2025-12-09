/**
 * Truncates a blockchain/wallet address for display
 * @param address - Full address string
 * @param maxLength - Maximum display length (default 20)
 * @returns Truncated address like "gonka1abc...xyz"
 */
export function truncateAddress(address: string, maxLength = 20): string {
  if (!address || address.length <= maxLength) return address;
  return `${address.slice(0, 12)}...${address.slice(-8)}`;
}
