const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const landRegistryFactory = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await landRegistryFactory.deploy();

  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();
  console.log("LandRegistry deployed to:", contractAddress);

  const artifact = await hre.artifacts.readArtifact("LandRegistry");
  const frontendConfigPath = path.join(__dirname, "..", "frontend", "src", "contract.js");

  const fileContent = `export const CONTRACT_ADDRESS = "${contractAddress}";

export const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};
`;

  fs.writeFileSync(frontendConfigPath, fileContent);
  console.log("Frontend contract config written to:", frontendConfigPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

