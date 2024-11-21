import '@xyrusworx/hardhat-solidity-json';
import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
import '@openzeppelin/hardhat-upgrades';
import 'solidity-coverage';
import '@nomiclabs/hardhat-solhint';
import '@primitivefi/hardhat-dodoc';
import "@nomiclabs/hardhat-etherscan";
// require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.22',
  },
  networks:{
     polygonAmoyTestnet:{
      url:"https://rpc-amoy.polygon.technology/",
      chainId: 80002,
      accounts:[`e400888c5cff3827ad344e7b5b5fc9c050eacf4c5217111f78158667a9da9fe0`]
    },
  },
  etherscan: {
    apiKey: `EFDIPH6ZVZ63TV6HDNG4KFNXIUYG7C86PQ`,
    customChains: [
      {
        network: "polygonAmoyTestnet",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
        },
      },
   

    ],
  },
  // gasReporter: {
  //   enabled: true,
  // },
  // dodoc: {
  //   runOnCompile: false,
  //   debugMode: true,
  //   outputDir: "./docgen",
  //   freshOutput: true,
  // },
};

export default config;
