// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MuttNFT.sol";

contract MuttNFTTest is Test {
    MuttNFT public nft;

    uint256 internal serverKey = 0xA11CE;
    address internal server;
    address internal platform = address(0xFEE);
    address internal alice = address(0x1);
    address internal bob = address(0x2);

    bytes32 private constant HATCH_TYPEHASH =
        keccak256("Hatch(address to,uint8 personality,uint256 nonce)");
    bytes32 private constant BREED_TYPEHASH =
        keccak256("Breed(address to,uint256 parentA,uint256 parentB,uint8 personality,uint256 nonce)");

    function setUp() public {
        vm.warp(1_000_000); // realistic timestamp
        server = vm.addr(serverKey);
        nft = new MuttNFT(server, platform);
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    // ── Helpers ──

    function _signHatch(address to, uint8 personality, uint256 nonce) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(abi.encode(HATCH_TYPEHASH, to, personality, nonce));
        bytes32 digest = _hashTypedData(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(serverKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signBreed(address to, uint256 parentA, uint256 parentB, uint8 personality, uint256 nonce)
        internal view returns (bytes memory)
    {
        bytes32 structHash = keccak256(abi.encode(BREED_TYPEHASH, to, parentA, parentB, personality, nonce));
        bytes32 digest = _hashTypedData(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(serverKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _hashTypedData(bytes32 structHash) internal view returns (bytes32) {
        bytes32 domainSeparator = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("MuttNFT"),
            keccak256("1"),
            block.chainid,
            address(nft)
        ));
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    // ── Genesis Hatch ──

    function test_GenesisHatch() public {
        bytes memory sig = _signHatch(alice, 7, 0); // ENFP
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        assertEq(nft.balanceOf(alice, 1), 1);
        assertEq(nft.nextTokenId(), 2);
        assertTrue(nft.hasGenesis(alice));

        MuttNFT.MuttData memory data = nft.getMutt(1);
        assertEq(data.personality, 7);
        assertEq(data.parentA, 0);
        assertEq(data.parentB, 0);
        assertEq(data.breeder, alice);
    }

    function test_GenesisHatch_RevertDoubleHatch() public {
        bytes memory sig1 = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig1);

        bytes memory sig2 = _signHatch(alice, 3, 1);
        vm.prank(alice);
        vm.expectRevert("Already hatched");
        nft.genesisHatch(3, sig2);
    }

    function test_GenesisHatch_RevertInvalidPersonality() public {
        bytes memory sig = _signHatch(alice, 16, 0);
        vm.prank(alice);
        vm.expectRevert("Invalid personality");
        nft.genesisHatch(16, sig);
    }

    function test_GenesisHatch_RevertBadSignature() public {
        // Sign for bob but call as alice
        bytes memory sig = _signHatch(bob, 7, 0);
        vm.prank(alice);
        vm.expectRevert("Invalid signature");
        nft.genesisHatch(7, sig);
    }

    // ── Breeding ──

    function _setupTwoMutts() internal returns (uint256 tokenA, uint256 tokenB) {
        bytes memory sigA = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sigA);
        tokenA = 1;

        bytes memory sigB = _signHatch(bob, 0, 0);
        vm.prank(bob);
        nft.genesisHatch(0, sigB);
        tokenB = 2;

        // Bob sets breed cost
        vm.prank(bob);
        nft.setBreedCost(tokenB, 0.1 ether);
    }

    function test_Breed() public {
        (uint256 tokenA, uint256 tokenB) = _setupTwoMutts();

        uint256 bobBefore = bob.balance;
        uint256 platBefore = platform.balance;

        bytes memory sig = _signBreed(alice, tokenA, tokenB, 4, 1);
        vm.prank(alice);
        nft.breed{value: 0.1 ether}(tokenA, tokenB, 4, sig);

        // New token minted
        assertEq(nft.balanceOf(alice, 3), 1);
        assertEq(nft.nextTokenId(), 4);

        // Check offspring data
        MuttNFT.MuttData memory child = nft.getMutt(3);
        assertEq(child.personality, 4); // INFJ
        assertEq(child.parentA, tokenA);
        assertEq(child.parentB, tokenB);
        assertEq(child.breeder, alice);

        // Fee distribution: 90% to bob, 10% to platform
        assertEq(bob.balance - bobBefore, 0.09 ether);
        assertEq(platform.balance - platBefore, 0.01 ether);
    }

    function test_Breed_RevertSameParent() public {
        bytes memory sigA = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sigA);

        bytes memory sig = _signBreed(alice, 1, 1, 4, 1);
        vm.prank(alice);
        vm.expectRevert("Same parents");
        nft.breed(1, 1, 4, sig);
    }

    function test_Breed_RevertNotOwner() public {
        _setupTwoMutts();

        // Bob tries to breed with alice's token as parentA
        bytes memory sig = _signBreed(bob, 1, 2, 4, 1);
        vm.prank(bob);
        vm.expectRevert("Not owner of parentA");
        nft.breed(1, 2, 4, sig);
    }

    function test_Breed_RevertCooldown() public {
        (uint256 tokenA, uint256 tokenB) = _setupTwoMutts();

        bytes memory sig1 = _signBreed(alice, tokenA, tokenB, 4, 1);
        vm.prank(alice);
        nft.breed{value: 0.1 ether}(tokenA, tokenB, 4, sig1);

        // Try again immediately
        bytes memory sig2 = _signBreed(alice, tokenA, tokenB, 5, 2);
        vm.prank(alice);
        vm.expectRevert("Cooldown active");
        nft.breed{value: 0.1 ether}(tokenA, tokenB, 5, sig2);
    }

    function test_Breed_AfterCooldown() public {
        (uint256 tokenA, uint256 tokenB) = _setupTwoMutts();

        bytes memory sig1 = _signBreed(alice, tokenA, tokenB, 4, 1);
        vm.prank(alice);
        nft.breed{value: 0.1 ether}(tokenA, tokenB, 4, sig1);

        // Warp past cooldown
        vm.warp(block.timestamp + 5 minutes + 1);

        bytes memory sig2 = _signBreed(alice, tokenA, tokenB, 5, 2);
        vm.prank(alice);
        nft.breed{value: 0.1 ether}(tokenA, tokenB, 5, sig2);

        assertEq(nft.balanceOf(alice, 4), 1);
    }

    function test_Breed_RevertInsufficientCost() public {
        (uint256 tokenA, uint256 tokenB) = _setupTwoMutts();

        bytes memory sig = _signBreed(alice, tokenA, tokenB, 4, 1);
        vm.prank(alice);
        vm.expectRevert("Insufficient breed cost");
        nft.breed{value: 0.05 ether}(tokenA, tokenB, 4, sig);
    }

    function test_Breed_FreeCost() public {
        bytes memory sigA = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sigA);

        bytes memory sigB = _signHatch(bob, 0, 0);
        vm.prank(bob);
        nft.genesisHatch(0, sigB);
        // Bob does NOT set breed cost (defaults to 0)

        bytes memory sig = _signBreed(alice, 1, 2, 4, 1);
        vm.prank(alice);
        nft.breed(1, 2, 4, sig);

        assertEq(nft.balanceOf(alice, 3), 1);
    }

    // ── Setters ──

    function test_SetBreedCost() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        vm.prank(alice);
        nft.setBreedCost(1, 0.5 ether);

        MuttNFT.MuttData memory data = nft.getMutt(1);
        assertEq(data.breedCost, 0.5 ether);
    }

    function test_SetBreedCost_RevertNotBreeder() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        vm.prank(bob);
        vm.expectRevert("Not breeder");
        nft.setBreedCost(1, 0.5 ether);
    }

    // ── Owner Admin ──

    function test_SetPlatformFee() public {
        nft.setPlatformFee(15);
        assertEq(nft.platformFeePercent(), 15);
    }

    function test_SetPlatformFee_RevertMax() public {
        vm.expectRevert("Max 20%");
        nft.setPlatformFee(21);
    }

    function test_SetBreedCooldown() public {
        nft.setBreedCooldown(10 minutes);
        assertEq(nft.breedCooldown(), 10 minutes);
    }

    function test_SetServerSigner() public {
        address newSigner = address(0xBEEF);
        nft.setServerSigner(newSigner);
        assertEq(nft.serverSigner(), newSigner);
    }
}
