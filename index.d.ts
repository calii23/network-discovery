interface NetworkDiscoveryConfig {
  application: string;

  version: string;
}

declare function startDiscovery(config: NetworkDiscoveryConfig): void;
