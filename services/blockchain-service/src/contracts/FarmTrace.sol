// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FarmTrace {
    struct SeasonRecord {
        string seasonId;
        string farmId;
        string initialData;
        uint256 createdAt;
        UpdateEntry[] updateHistory;
    }

    struct UpdateEntry {
        string data;
        uint256 timestamp;
    }

    mapping(string => SeasonRecord) public seasons;

    event SeasonCreated(string indexed seasonId, string farmId);
    event SeasonUpdated(string indexed seasonId, string data);

    function createSeason(string memory _seasonId, string memory _farmId, string memory _initialData) external {
        require(bytes(seasons[_seasonId].seasonId).length == 0, "Season exists");
        seasons[_seasonId].seasonId = _seasonId;
        seasons[_seasonId].farmId = _farmId;
        seasons[_seasonId].initialData = _initialData;
        seasons[_seasonId].createdAt = block.timestamp;
        emit SeasonCreated(_seasonId, _farmId);
    }

    function updateSeason(string memory _seasonId, string memory _data) external {
        require(bytes(seasons[_seasonId].seasonId).length > 0, "Season not found");
        seasons[_seasonId].updateHistory.push(UpdateEntry(_data, block.timestamp));
        emit SeasonUpdated(_seasonId, _data);
    }

    function getSeason(string memory _seasonId) external view returns (SeasonRecord memory) {
        return seasons[_seasonId];
    }
}