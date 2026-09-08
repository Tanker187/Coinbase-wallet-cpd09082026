export function formatNetworkId(networkId: string): string {
  if (!networkId) return 'Unknown';
  if (networkId === 'base-sepolia') return 'Base Sepolia';
  if (networkId === 'base-mainnet') return 'Base Mainnet';
  if (networkId === 'ethereum-sepolia') return 'Ethereum Sepolia';
  if (networkId === 'ethereum-mainnet') return 'Ethereum Mainnet';
  return networkId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
