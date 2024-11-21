const hre = require("hardhat");
const { ethers } = require('hardhat');


async function main() {
//   [owner, acc1, acc2] = await ethers.getSigners();
const owner = "0xFf14feBe521C732E7FE1913bFD04dfbd03F40c9f";
  const XPPToken = await hre.ethers.getContractFactory("XPPToken");
  const xppToken = await XPPToken.deploy(owner);

  await xppToken.deployed();

  console.log(
    `XPPToken deployed at ${xppToken.address}`
  );
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});