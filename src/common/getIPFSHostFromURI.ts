export function getIPFSHostFromURI(uri: string): string | null {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "");
  }
  return null;
}