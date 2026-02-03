import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("MockUSDC deployed to:", await usdc.getAddress());

  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy(await usdc.getAddress());
  await agentRegistry.waitForDeployment();
  console.log("AgentRegistry deployed to:", await agentRegistry.getAddress());

  const JobEscrow = await ethers.getContractFactory("JobEscrow");
  const jobEscrow = await JobEscrow.deploy(
    await usdc.getAddress(),
    await agentRegistry.getAddress()
  );
  await jobEscrow.waitForDeployment();
  console.log("JobEscrow deployed to:", await jobEscrow.getAddress());

  await agentRegistry.setJobEscrow(await jobEscrow.getAddress());
  console.log("Granted JobEscrow permissions to AgentRegistry");

  const addresses = {
    MockUSDC: await usdc.getAddress(),
    AgentRegistry: await agentRegistry.getAddress(),
    JobEscrow: await jobEscrow.getAddress(),
    chainId: 31337
  };

  console.log("\n=== Deployed Addresses ===");
  console.log(JSON.stringify(addresses, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
