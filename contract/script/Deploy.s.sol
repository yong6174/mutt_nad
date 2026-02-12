// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MuttNFT.sol";

contract DeployScript is Script {
    function run() external {
        // .env NETWORK에 따라 TESTNET_ / MAINNET_ prefix 선택
        string memory net = vm.envString("NETWORK"); // "testnet" or "mainnet"
        string memory prefix = keccak256(bytes(net)) == keccak256("mainnet")
            ? "MAINNET_"
            : "TESTNET_";

        uint256 deployerKey = vm.envUint(string.concat(prefix, "PRIVATE_KEY"));
        address serverSigner = vm.envAddress(string.concat(prefix, "SERVER_SIGNER"));
        address platformWallet = vm.envAddress(string.concat(prefix, "PLATFORM_WALLET"));
        address muttToken = vm.envAddress(string.concat(prefix, "MUTT_TOKEN"));

        console.log("Deploying to:", net);
        console.log("Server signer:", serverSigner);
        console.log("Platform wallet:", platformWallet);
        console.log("MUTT token:", muttToken);

        vm.startBroadcast(deployerKey);
        MuttNFT nft = new MuttNFT(serverSigner, platformWallet, muttToken);
        vm.stopBroadcast();

        console.log("MuttNFT deployed at:", address(nft));
    }
}
