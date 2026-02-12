// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MuttNFT.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Simple mock ERC-20 for testing
contract MockMuttToken is ERC20 {
    constructor() ERC20("Mutt Token", "MUTT") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MuttNFTTest is Test {
    MuttNFT public nft;
    MockMuttToken public token;

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
        token = new MockMuttToken();
        nft = new MuttNFT(server, platform, address(token));

        // Give alice & bob MUTT tokens
        token.mint(alice, 1000 ether);
        token.mint(bob, 1000 ether);
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

        // Bob sets breed cost to 100 MUTT
        vm.prank(bob);
        nft.setBreedCost(tokenB, 100 ether);

        // Alice approves MuttNFT to spend her tokens
        vm.prank(alice);
        token.approve(address(nft), type(uint256).max);
    }

    function test_Breed() public {
        (uint256 tokenA, uint256 tokenB) = _setupTwoMutts();

        uint256 bobBefore = token.balanceOf(bob);
        uint256 platBefore = token.balanceOf(platform);
        uint256 aliceBefore = token.balanceOf(alice);

        bytes memory sig = _signBreed(alice, tokenA, tokenB, 4, 1);
        vm.prank(alice);
        nft.breed(tokenA, tokenB, 4, sig);

        // New token minted
        assertEq(nft.balanceOf(alice, 3), 1);
        assertEq(nft.nextTokenId(), 4);

        // Check offspring data
        MuttNFT.MuttData memory child = nft.getMutt(3);
        assertEq(child.personality, 4); // INFJ
        assertEq(child.parentA, tokenA);
        assertEq(child.parentB, tokenB);
        assertEq(child.breeder, alice);

        // ERC-20 fee distribution: 90 MUTT to bob, 10 MUTT to platform
        assertEq(token.balanceOf(bob) - bobBefore, 90 ether);
        assertEq(token.balanceOf(platform) - platBefore, 10 ether);
        assertEq(aliceBefore - token.balanceOf(alice), 100 ether);
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
        vm.prank(bob);
        token.approve(address(nft), type(uint256).max);

        bytes memory sig = _signBreed(bob, 1, 2, 4, 1);
        vm.prank(bob);
        vm.expectRevert("Not owner of parentA");
        nft.breed(1, 2, 4, sig);
    }

    function test_Breed_RevertCooldown() public {
        (uint256 tokenA, uint256 tokenB) = _setupTwoMutts();

        bytes memory sig1 = _signBreed(alice, tokenA, tokenB, 4, 1);
        vm.prank(alice);
        nft.breed(tokenA, tokenB, 4, sig1);

        // Try again immediately
        bytes memory sig2 = _signBreed(alice, tokenA, tokenB, 5, 2);
        vm.prank(alice);
        vm.expectRevert("Cooldown active");
        nft.breed(tokenA, tokenB, 5, sig2);
    }

    function test_Breed_AfterCooldown() public {
        (uint256 tokenA, uint256 tokenB) = _setupTwoMutts();

        bytes memory sig1 = _signBreed(alice, tokenA, tokenB, 4, 1);
        vm.prank(alice);
        nft.breed(tokenA, tokenB, 4, sig1);

        // Warp past cooldown
        vm.warp(block.timestamp + 5 minutes + 1);

        bytes memory sig2 = _signBreed(alice, tokenA, tokenB, 5, 2);
        vm.prank(alice);
        nft.breed(tokenA, tokenB, 5, sig2);

        assertEq(nft.balanceOf(alice, 4), 1);
    }

    function test_Breed_RevertInsufficientAllowance() public {
        bytes memory sigA = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sigA);

        bytes memory sigB = _signHatch(bob, 0, 0);
        vm.prank(bob);
        nft.genesisHatch(0, sigB);

        vm.prank(bob);
        nft.setBreedCost(2, 100 ether);

        // Alice does NOT approve — should revert
        bytes memory sig = _signBreed(alice, 1, 2, 4, 1);
        vm.prank(alice);
        vm.expectRevert();
        nft.breed(1, 2, 4, sig);
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

    function test_Breed_UnlimitedApproval() public {
        (uint256 tokenA, uint256 tokenB) = _setupTwoMutts();

        // First breed
        bytes memory sig1 = _signBreed(alice, tokenA, tokenB, 4, 1);
        vm.prank(alice);
        nft.breed(tokenA, tokenB, 4, sig1);

        // Warp past cooldown
        vm.warp(block.timestamp + 5 minutes + 1);

        // Second breed — no additional approval needed
        bytes memory sig2 = _signBreed(alice, tokenA, tokenB, 5, 2);
        vm.prank(alice);
        nft.breed(tokenA, tokenB, 5, sig2);

        assertEq(nft.balanceOf(alice, 3), 1);
        assertEq(nft.balanceOf(alice, 4), 1);
    }

    // ── Setters ──

    function test_SetBreedCost() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        vm.prank(alice);
        nft.setBreedCost(1, 50 ether); // 50 MUTT

        MuttNFT.MuttData memory data = nft.getMutt(1);
        assertEq(data.breedCost, 50 ether);
    }

    function test_SetBreedCost_RevertNotBreeder() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        vm.prank(bob);
        vm.expectRevert("Not breeder");
        nft.setBreedCost(1, 50 ether);
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

    // ── Mint ──

    function test_Mint_Free() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        // Mint is free by default (mintCost == 0)
        vm.prank(bob);
        nft.mint(1);

        assertEq(nft.balanceOf(bob, 1), 1);
        MuttNFT.MuttData memory data = nft.getMutt(1);
        assertEq(data.totalSupply, 2);
    }

    function test_Mint_WithCost() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        // Alice sets mint cost
        vm.prank(alice);
        nft.setMintConfig(1, 50 ether, 100);

        // Bob approves and mints
        vm.prank(bob);
        token.approve(address(nft), type(uint256).max);

        uint256 aliceBefore = token.balanceOf(alice);
        uint256 platBefore = token.balanceOf(platform);

        vm.prank(bob);
        nft.mint(1);

        assertEq(nft.balanceOf(bob, 1), 1);
        assertEq(token.balanceOf(alice) - aliceBefore, 45 ether); // 90%
        assertEq(token.balanceOf(platform) - platBefore, 5 ether); // 10%

        MuttNFT.MuttData memory data = nft.getMutt(1);
        assertEq(data.totalSupply, 2);
    }

    function test_Mint_RevertSoldOut() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        // Set max supply to 1 (already minted 1 for breeder)
        vm.prank(alice);
        nft.setMintConfig(1, 0, 1);

        vm.prank(bob);
        vm.expectRevert("Sold out");
        nft.mint(1);
    }

    function test_Mint_RevertNotExists() public {
        vm.prank(bob);
        vm.expectRevert("Token not exists");
        nft.mint(999);
    }

    function test_Mint_RevertInsufficientBalance() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        vm.prank(alice);
        nft.setMintConfig(1, 50 ether, 0);

        // Bob does NOT approve
        vm.prank(bob);
        vm.expectRevert();
        nft.mint(1);
    }

    function test_Mint_Unlimited() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        // maxSupply=0 means unlimited
        vm.prank(bob);
        nft.mint(1);
        vm.prank(bob);
        nft.mint(1);
        vm.prank(bob);
        nft.mint(1);

        assertEq(nft.balanceOf(bob, 1), 3);
        MuttNFT.MuttData memory data = nft.getMutt(1);
        assertEq(data.totalSupply, 4);
    }

    // ── SetMintConfig ──

    function test_SetMintConfig() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        vm.prank(alice);
        nft.setMintConfig(1, 100 ether, 50);

        MuttNFT.MuttData memory data = nft.getMutt(1);
        assertEq(data.mintCost, 100 ether);
        assertEq(data.maxSupply, 50);
    }

    function test_SetMintConfig_RevertNotBreeder() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        vm.prank(bob);
        vm.expectRevert("Not breeder");
        nft.setMintConfig(1, 100 ether, 50);
    }

    function test_SetMintConfig_RevertMaxBelowCurrent() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        // Mint once to increase totalSupply to 2
        vm.prank(bob);
        nft.mint(1);

        // Try to set maxSupply=1 (below totalSupply=2)
        vm.prank(alice);
        vm.expectRevert("Max below current supply");
        nft.setMintConfig(1, 0, 1);
    }

    // ── GenesisHatch / Breed default values ──

    function test_GenesisHatch_DefaultMintFields() public {
        bytes memory sig = _signHatch(alice, 7, 0);
        vm.prank(alice);
        nft.genesisHatch(7, sig);

        MuttNFT.MuttData memory data = nft.getMutt(1);
        assertEq(data.mintCost, 0);
        assertEq(data.maxSupply, 0);
        assertEq(data.totalSupply, 1);
    }

    function test_Breed_DefaultMintFields() public {
        (uint256 tokenA, uint256 tokenB) = _setupTwoMutts();

        bytes memory sig = _signBreed(alice, tokenA, tokenB, 4, 1);
        vm.prank(alice);
        nft.breed(tokenA, tokenB, 4, sig);

        MuttNFT.MuttData memory data = nft.getMutt(3);
        assertEq(data.mintCost, 0);
        assertEq(data.maxSupply, 0);
        assertEq(data.totalSupply, 1);
    }

    // ── Token reference ──

    function test_MuttTokenAddress() public view {
        assertEq(address(nft.muttToken()), address(token));
    }
}
