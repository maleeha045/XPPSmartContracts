import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("XPPToken", function () {
    let XPPToken: Contract;
    let owner: Signer;
    let addr1: Signer;
    let addr2: Signer;

    beforeEach(async () => {
        // Get signers
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the XPPToken contract
        const XPPTokenFactory = await ethers.getContractFactory("XPPToken");
        XPPToken = await XPPTokenFactory.deploy(await owner.getAddress());
        await XPPToken.deployed();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async () => {
            expect(await XPPToken.owner()).to.equal(await owner.getAddress());
        });

        it("Should mint the initial supply to the owner", async () => {
            const ownerBalance = await XPPToken.balanceOf(await owner.getAddress());
            expect(ownerBalance).to.equal(ethers.utils.parseUnits("500000000", 18));
        });

        it("Should have correct token name and symbol", async () => {
            expect(await XPPToken.name()).to.equal("XPPToken");
            expect(await XPPToken.symbol()).to.equal("XPP");
        });
    });

    describe("Minting", function () {
        it("Should allow the owner to mint tokens", async () => {
            const mintAmount = ethers.utils.parseUnits("1000", 18);
            await XPPToken.mint(await addr1.getAddress(), mintAmount);
            const addr1Balance = await XPPToken.balanceOf(await addr1.getAddress());
            expect(addr1Balance).to.equal(mintAmount);
        });

        it("Should revert if a non-owner tries to mint", async () => {
            const mintAmount = ethers.utils.parseUnits("1000", 18);
            await expect(
                XPPToken.connect(addr1).mint(await addr1.getAddress(), mintAmount)
            ).to.be.reverted;
        });
    });

    describe("Burning", function () {
        it("Should allow token holders to burn their tokens", async () => {
            const transferAmount = ethers.utils.parseUnits("500", 18);
            const burnAmount = ethers.utils.parseUnits("100", 18);

            await XPPToken.transfer(await addr1.getAddress(), transferAmount);
            await XPPToken.connect(addr1).burn(burnAmount);

            const addr1Balance = await XPPToken.balanceOf(await addr1.getAddress());
            expect(addr1Balance).to.equal(transferAmount.sub(burnAmount));
        });

        it("Should revert if trying to burn more than balance", async () => {
            const burnAmount = ethers.utils.parseUnits("100", 18);
            await expect(
                XPPToken.connect(addr1).burn(burnAmount)
            ).to.be.reverted;
        });
    });

    describe("Ownership", function () {
        it("Should transfer ownership correctly", async () => {
            await XPPToken.transferOwnership(await addr1.getAddress());
            expect(await XPPToken.owner()).to.equal(await addr1.getAddress());
        });

        it("Should allow only the owner to transfer ownership", async () => {
            await expect(
                XPPToken.connect(addr1).transferOwnership(await addr2.getAddress())
            ).to.be.reverted;
        });
    });
});
