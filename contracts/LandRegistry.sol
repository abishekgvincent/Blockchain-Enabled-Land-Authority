// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LandRegistry {
    struct Land {
        uint256 id;
        address owner;
        string location;
    }

    mapping(uint256 => Land) private lands;
    mapping(uint256 => bool) private landExists;
    uint256[] private landIds;

    event LandRegistered(uint256 indexed landId, address indexed owner, string location);
    event LandTransferred(uint256 indexed landId, address indexed oldOwner, address indexed newOwner);

    function registerLand(uint256 landId, address owner, string memory location) public {
        require(!landExists[landId], "Land already registered");
        require(owner != address(0), "Invalid owner address");
        require(bytes(location).length > 0, "Location is required");

        lands[landId] = Land({
            id: landId,
            owner: owner,
            location: location
        });

        landExists[landId] = true;
        landIds.push(landId);

        emit LandRegistered(landId, owner, location);
    }

    function transferLand(uint256 landId, address newOwner) public {
        require(landExists[landId], "Land does not exist");
        require(newOwner != address(0), "Invalid new owner address");

        Land storage land = lands[landId];
        require(msg.sender == land.owner, "Only current owner can transfer");

        address oldOwner = land.owner;
        land.owner = newOwner;

        emit LandTransferred(landId, oldOwner, newOwner);
    }

    function getLand(uint256 landId) public view returns (Land memory) {
        require(landExists[landId], "Land does not exist");
        return lands[landId];
    }

    function getAllLands() public view returns (Land[] memory) {
        Land[] memory allLands = new Land[](landIds.length);

        for (uint256 i = 0; i < landIds.length; i++) {
            allLands[i] = lands[landIds[i]];
        }

        return allLands;
    }

    function verifyOwnership(uint256 landId, address owner) public view returns (bool) {
        if (!landExists[landId]) {
            return false;
        }

        return lands[landId].owner == owner;
    }
}

