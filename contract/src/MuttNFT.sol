// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract MuttNFT is ERC1155, EIP712, Ownable {
    using ECDSA for bytes32;

    struct MuttData {
        uint8 personality;       // 0~15 (MBTI index)
        uint256 parentA;
        uint256 parentB;
        address breeder;
        uint256 breedCost;       // MUTT ERC-20 token amount
        uint256 lastBreedTime;
    }

    IERC20 public muttToken;
    uint256 public nextTokenId = 1;
    address public serverSigner;
    uint256 public platformFeePercent = 10; // 10%
    address public platformWallet;
    uint256 public breedCooldown = 5 minutes;

    mapping(uint256 => MuttData) public mutts;
    mapping(address => bool) public hasGenesis;
    mapping(address => uint256) public nonces;

    bytes32 private constant HATCH_TYPEHASH =
        keccak256("Hatch(address to,uint8 personality,uint256 nonce)");
    bytes32 private constant BREED_TYPEHASH =
        keccak256("Breed(address to,uint256 parentA,uint256 parentB,uint8 personality,uint256 nonce)");

    event GenesisHatch(uint256 indexed tokenId, address indexed owner, uint8 personality);
    event Bred(uint256 indexed newTokenId, uint256 parentA, uint256 parentB, address indexed breeder);
    event BreedCostSet(uint256 indexed tokenId, uint256 cost);

    constructor(address _serverSigner, address _platformWallet, address _muttToken)
        ERC1155("")
        EIP712("MuttNFT", "1")
        Ownable(msg.sender)
    {
        serverSigner = _serverSigner;
        platformWallet = _platformWallet;
        muttToken = IERC20(_muttToken);
    }

    // ──────────────────────────────────────────────
    //  Genesis Hatch (1 per wallet)
    // ──────────────────────────────────────────────

    function genesisHatch(
        uint8 personality,
        bytes calldata signature
    ) external {
        require(!hasGenesis[msg.sender], "Already hatched");
        require(personality < 16, "Invalid personality");

        bytes32 structHash = keccak256(abi.encode(
            HATCH_TYPEHASH, msg.sender, personality, nonces[msg.sender]++
        ));
        bytes32 hash = _hashTypedDataV4(structHash);
        require(hash.recover(signature) == serverSigner, "Invalid signature");

        uint256 tokenId = nextTokenId++;
        hasGenesis[msg.sender] = true;

        mutts[tokenId] = MuttData({
            personality: personality,
            parentA: 0,
            parentB: 0,
            breeder: msg.sender,
            breedCost: 0,
            lastBreedTime: 0
        });

        _mint(msg.sender, tokenId, 1, "");
        emit GenesisHatch(tokenId, msg.sender, personality);
    }

    // ──────────────────────────────────────────────
    //  Breeding
    // ──────────────────────────────────────────────

    function breed(
        uint256 parentA,
        uint256 parentB,
        uint8 personality,
        bytes calldata signature
    ) external {
        require(parentA != parentB, "Same parents");
        require(balanceOf(msg.sender, parentA) > 0, "Not owner of parentA");
        require(personality < 16, "Invalid personality");

        MuttData storage partnerMutt = mutts[parentB];
        require(partnerMutt.breeder != address(0), "Partner not exists");

        MuttData storage myMutt = mutts[parentA];
        require(
            block.timestamp >= myMutt.lastBreedTime + breedCooldown,
            "Cooldown active"
        );

        bytes32 structHash = keccak256(abi.encode(
            BREED_TYPEHASH, msg.sender, parentA, parentB, personality, nonces[msg.sender]++
        ));
        bytes32 hash = _hashTypedDataV4(structHash);
        require(hash.recover(signature) == serverSigner, "Invalid signature");

        // ERC-20 fee distribution: 90% to breeder, 10% to platform
        if (partnerMutt.breedCost > 0) {
            uint256 platformFee = (partnerMutt.breedCost * platformFeePercent) / 100;
            uint256 breederFee = partnerMutt.breedCost - platformFee;
            require(muttToken.transferFrom(msg.sender, partnerMutt.breeder, breederFee), "Breeder fee transfer failed");
            require(muttToken.transferFrom(msg.sender, platformWallet, platformFee), "Platform fee transfer failed");
        }

        uint256 tokenId = nextTokenId++;
        myMutt.lastBreedTime = block.timestamp;

        mutts[tokenId] = MuttData({
            personality: personality,
            parentA: parentA,
            parentB: parentB,
            breeder: msg.sender,
            breedCost: 0,
            lastBreedTime: 0
        });

        _mint(msg.sender, tokenId, 1, "");
        emit Bred(tokenId, parentA, parentB, msg.sender);
    }

    // ──────────────────────────────────────────────
    //  Setters
    // ──────────────────────────────────────────────

    function setBreedCost(uint256 tokenId, uint256 cost) external {
        require(mutts[tokenId].breeder == msg.sender, "Not breeder");
        mutts[tokenId].breedCost = cost;
        emit BreedCostSet(tokenId, cost);
    }

    function getMutt(uint256 tokenId) external view returns (MuttData memory) {
        return mutts[tokenId];
    }

    // ──────────────────────────────────────────────
    //  Owner admin
    // ──────────────────────────────────────────────

    function setServerSigner(address _signer) external onlyOwner {
        serverSigner = _signer;
    }

    function setPlatformFee(uint256 _percent) external onlyOwner {
        require(_percent <= 20, "Max 20%");
        platformFeePercent = _percent;
    }

    function setBreedCooldown(uint256 _seconds) external onlyOwner {
        breedCooldown = _seconds;
    }
}
