import { expect } from "chai";
import { ethers } from "hardhat";

describe("FarmTrace", function () {
  it("Should create season and get correct data", async function () {
    const FarmTrace = await ethers.getContractFactory("FarmTrace");
    const contract = await FarmTrace.deploy();
    await contract.waitForDeployment();

    await contract.createSeason("S001", "FARM01", "Initial data");
    const season = await contract.getSeason("S001");

    expect(season.seasonId).to.equal("S001");
    expect(season.farmId).to.equal("FARM01");
  });
});