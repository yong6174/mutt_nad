// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MuttNFT.sol";

contract DeployScript is Script {
    function run() external {
        address serverSigner = vm.envAddress("SERVER_SIGNER");
        address platformWallet = vm.envAddress("PLATFORM_WALLET");

        vm.startBroadcast();
        MuttNFT nft = new MuttNFT(serverSigner, platformWallet);
        vm.stopBroadcast();

        console.log("MuttNFT deployed at:", address(nft));
    }
}
