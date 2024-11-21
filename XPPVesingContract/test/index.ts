import { expect } from "chai";
import { loadFixture } from "ethereum-waffle";
import { ethers } from "hardhat";
import { mine, time } from "@nomicfoundation/hardhat-network-helpers";

describe("Vesting", function () {
  async function deployFunction() {
    // get signers 
    const [
      owner,
      tokenHolder,
      nonOwner,
      firstHolder,
      seedRoundHolder,
      privateSaleHolder,
      publicPresaleHolder,
      publicSaleHolder,
      liquidityHolder,
      marketingHolder,
      teamHolder,
      stakingRewardHolder,
      ecosystemHolder,
      airdropHolder,
      treasuryHolder,
    ] = await ethers.getSigners();

    // deploy token
    const Token = await ethers.getContractFactory("Token");

    // token constructor params
    const name = "Token";
    const symbol = "TKN";
    // supply should be 500 Million
    const totalSupply = ethers.utils.parseEther("500000000");

    const token = await Token.connect(tokenHolder).deploy(
      name,
      symbol,
      totalSupply,
    )

    await token.deployed();

    const tokenAddress = await token?.address;

    // deploy vesting contract
    const Vesting = await ethers.getContractFactory("XPPVesting");

    const vesting = await Vesting.connect(owner).deploy(
      tokenAddress,
    );

    await vesting.deployed();

    const vestingAddress = await vesting?.address;

    return {
      name,
      symbol,
      totalSupply,
      owner,
      tokenHolder,
      nonOwner,
      firstHolder,
      seedRoundHolder,
      privateSaleHolder,
      publicPresaleHolder,
      publicSaleHolder,
      liquidityHolder,
      marketingHolder,
      teamHolder,
      stakingRewardHolder,
      ecosystemHolder,
      airdropHolder,
      treasuryHolder,
      token,
      tokenAddress,
      vesting,
      vestingAddress,
    }
  }
  it("Should set the right name and symbol", async function () {
    const { name, symbol, token } = await loadFixture(deployFunction);

    expect(await token.name()).to.equal(name);
    expect(await token.symbol()).to.equal(symbol);
  });

  it("Should set the right total supply", async function () {
    const { totalSupply, token } = await loadFixture(deployFunction);

    expect(await token.totalSupply()).to.equal(totalSupply);
  });

  it("Should set the right owner", async function () {
    const { owner, vesting } = await loadFixture(deployFunction);

    expect(await vesting.owner()).to.equal(owner.address);
  });

  it("Should set the right token address", async function () {
    const { tokenAddress, vesting } = await loadFixture(deployFunction);

    expect(await vesting.getToken()).to.equal(tokenAddress);
  });

  it("Should have the right token balance", async function () {
    const { token, vestingAddress, tokenHolder, totalSupply } = await loadFixture(deployFunction);

    expect(await token.balanceOf(vestingAddress)).to.equal(0);

    expect(await token.balanceOf(tokenHolder.address)).to.equal(totalSupply);
  });

  it("Should transfer 10 token to the vesting contract", async function () {
    const { token, vesting, vestingAddress, tokenHolder } = await loadFixture(deployFunction);

    const tokenHolderBalanceBefore = await token.balanceOf(tokenHolder.address);

    const amount = ethers.utils.parseEther("10");

    await token.connect(tokenHolder).transfer(vestingAddress, amount);

    const tokenHolderBalanceAfter = await token.balanceOf(tokenHolder.address);

    expect(tokenHolderBalanceBefore.sub(tokenHolderBalanceAfter)).to.equal(amount);

    expect(await token.balanceOf(vestingAddress)).to.equal(amount);
  });

  it("Should vesting has right balance", async () => {
    const { token, vestingAddress } = await loadFixture(deployFunction);

    const amount = ethers.utils.parseEther("10");

    expect(await token.balanceOf(vestingAddress)).to.equal(amount);
  });

  it('Should have right vesting amount', async () => {
    const { vesting } = await loadFixture(deployFunction);

    const amount = ethers.utils.parseEther("0");

    const vestingAmount = await vesting.getVestingSchedulesTotalAmount();

    expect(vestingAmount).to.equal(0);
  });

  it("Should return right withdrawable amount", async function () {
    const { vesting, tokenHolder } = await loadFixture(deployFunction);

    const amount = ethers.utils.parseEther("10");

    const withdrawableAmount = await vesting.getWithdrawableAmount();

    expect(withdrawableAmount).to.equal(amount);
  });

  it("Should return right vesting schedule count", async () => {
    const { vesting } = await loadFixture(deployFunction);

    const scheduleCount = await vesting.getVestingSchedulesCount();

    expect(scheduleCount).to.equal(0);
  });

  it("Should Fail: add vesting schedule by non owner", async function () {
    const { vesting, nonOwner, seedRoundHolder } = await loadFixture(deployFunction);

    const amount = ethers.utils.parseEther("10");

    // beneficiary address
    const beneficiary = seedRoundHolder?.address;

    // start time (1 day from now)
    const startTime = (await time.latest()) + time.duration.days(1);

    // cliff duration (12 months)
    const cliffDuration = time.duration.days(360);

    // duration (18 months) 
    const duration = time.duration.days(540);

    // revocable (false)
    const revocable = true;

    // slice period (1 month)
    const slicePeriod = time.duration.days(30);

    await expect(vesting.connect(nonOwner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amount,
    )).to.be.revertedWith(`OwnableUnauthorizedAccount("${nonOwner.address}")`);
  });

  it("Should Fail: add vesting schedule with zero address", async function () {
    const { vesting, owner } = await loadFixture(deployFunction);

    const amount = ethers.utils.parseEther("10");

    // beneficiary address
    const beneficiary = ethers.constants.AddressZero;

    // start time (1 day from now)
    const startTime = (await time.latest()) + time.duration.days(1);

    // cliff duration (12 months)
    const cliffDuration = time.duration.days(360);

    // duration (18 months) 
    const duration = time.duration.days(540);

    // revocable (false)
    const revocable = true;

    // slice period (1 month)
    const slicePeriod = time.duration.days(30);

    await expect(vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amount,
    )).to.be.revertedWith('TokenVesting: beneficiary is the zero address');
  });

  it("Should Fail: add vesting schedule with zero amount", async function () {
    const { vesting, owner, seedRoundHolder } = await loadFixture(deployFunction);

    const amount = ethers.utils.parseEther("0");

    // beneficiary address
    const beneficiary = seedRoundHolder?.address;

    // start time (1 day from now)
    const startTime = (await time.latest()) + time.duration.days(1);

    // cliff duration (12 months)
    const cliffDuration = time.duration.days(360);

    // duration (18 months) 
    const duration = time.duration.days(540);

    // revocable (false)
    const revocable = true;

    // slice period (1 month)
    const slicePeriod = time.duration.days(30);

    await expect(vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amount,
    )).to.be.revertedWith('TokenVesting: amount must be > 0');
  });

  it("Should Fail: add vesting without allowance", async function () {
    const { token, vesting, owner, seedRoundHolder } = await loadFixture(deployFunction);

    const amount = ethers.utils.parseEther("1000");

    // beneficiary address
    const beneficiary = seedRoundHolder?.address;

    // start time (1 day from now)
    const startTime = (await time.latest()) + time.duration.days(1);

    // cliff duration (12 months)
    const cliffDuration = time.duration.days(360);

    // duration (18 months) 
    const duration = time.duration.days(540);

    // revocable (false)
    const revocable = true;

    // slice period (1 month)
    const slicePeriod = time.duration.days(30);

    await expect(vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amount,
    )).to.be.revertedWith(`ERC20InsufficientAllowance("${vesting.address}", 0, ${amount})`);
  });

  it("Should Fail: add vesting with less balance", async function () {
    const { token, vesting, owner, seedRoundHolder } = await loadFixture(deployFunction);

    const amount = ethers.utils.parseEther("1000");

    // beneficiary address
    const beneficiary = seedRoundHolder?.address;

    // start time (1 day from now)
    const startTime = (await time.latest()) + time.duration.days(1);

    // cliff duration (12 months)
    const cliffDuration = time.duration.days(360);

    // duration (18 months) 
    const duration = time.duration.days(540);

    // revocable (false)
    const revocable = true;

    // slice period (1 month)
    const slicePeriod = time.duration.days(30);

    const approveTrx = await token.connect(owner).approve(vesting.address, amount);
    await approveTrx.wait();

    await expect(vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amount,
    )).to.be.revertedWith(`ERC20InsufficientBalance("${owner.address}", 0, ${amount})`);
  });

  it("Add vesting to first holder", async function () {
    // first holder: 1,200,000
    // 36 months cliff, then linear vesting over 24 months.
    const { token, vesting, owner, tokenHolder, firstHolder } = await deployFunction();

    const amount = ethers.utils.parseEther("1200000");

    // transfer 1.2 million XPP from tokenHolder to owner
    await token.connect(tokenHolder).transfer(owner?.address, amount);

    // beneficiary address
    const beneficiary = firstHolder?.address;

    // start time =0(current time)
    const startTime = 0;

    // cliff duration (36 months)
    const cliffDuration = time.duration.days(1080);

    // duration (24 months)
    const duration = time.duration.days(720);

    // revocable (true)
    const revocable = true;

    // slice period (1 month)
    const slicePeriod = time.duration.days(30);

    // approve token to vesting contract
    await token.connect(owner).approve(vesting.address, amount);

    await vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amount,
    );

    const totalVestingsForFirstHolder = await vesting.getVestingSchedulesCountForHolder(
      firstHolder?.address
    );

    expect(totalVestingsForFirstHolder).to.equal(1);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(firstHolder?.address, 0);

    const vestingSchedule = await vesting.getVestingSchedule(vestingId);

    expect(vestingSchedule.beneficiary).to.equal(firstHolder?.address);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);

    // forward time by 1 month
    await time.increase(30 * 24 * 60 * 60);
    await mine(1);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);

    // forward time by 19 months
    await time.increase(19 * 30 * 24 * 60 * 60);
    await mine(1);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);

    // forward time by 4 months
    await time.increase(4 * 30 * 24 * 60 * 60);
    await mine(1);

    const releasableAmountAfter24Months = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmountAfter24Months).to.equal(0);

    await time.increase(30 * 24 * 60 * 60);

    const releasableAmountAfter25Months = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmountAfter25Months).to.equal(0);

    // increase to 36 months
    await time.increase(11 * 30 * 24 * 60 * 60);

    const releasableAmountAfter36Months = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmountAfter36Months).to.equal(0);

    // try to release 10000
    const amountToRelease01 = ethers.utils.parseEther("10000");
    await expect(vesting.connect(firstHolder).release(vestingId, amountToRelease01)).to.be.revertedWith("TokenVesting: cannot release tokens, not enough vested tokens");

    // increase to 37 months
    await time.increase(30 * 24 * 60 * 60);

    const releasableAmountAfter37Months = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmountAfter37Months).to.equal(amount.div(24));

    // increase to 38 months
    await time.increase(30 * 24 * 60 * 60);
    await mine(1);

    const releasableAmountAfter38Months = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmountAfter38Months).to.equal(amount.div(24).mul(2));

    const holderBalanceBefore = await token.balanceOf(firstHolder?.address);
    const vestingBalanceBefore = await token.balanceOf(vesting.address);

    // release 20000
    const amountToRelease02 = ethers.utils.parseEther("20000");


    const release01Trx = await vesting.connect(firstHolder).release(vestingId, amountToRelease02);

    await release01Trx.wait();

    const holderBalanceAfter = await token.balanceOf(firstHolder?.address);

    const vestingBalanceAfter = await token.balanceOf(vesting.address);

    expect(holderBalanceAfter.sub(holderBalanceBefore)).to.equal(amountToRelease02);

    expect(vestingBalanceBefore.sub(vestingBalanceAfter)).to.equal(amountToRelease02);

    const releasableAmountAfterRelease01 = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmountAfterRelease01).to.equal(amount.div(24).mul(2).sub(amountToRelease02));

    const holderBalanceBeforeRelease02 = await token.balanceOf(firstHolder?.address);

    const vestingBalanceBeforeRelease02 = await token.balanceOf(vesting.address);

    // release all
    const release02Trx = await vesting.connect(firstHolder).release(vestingId, releasableAmountAfterRelease01);

    await release02Trx.wait();

    const holderBalanceAfterRelease02 = await token.balanceOf(firstHolder?.address);

    const vestingBalanceAfterRelease02 = await token.balanceOf(vesting.address);

    expect(holderBalanceAfterRelease02.sub(holderBalanceBeforeRelease02)).to.equal(releasableAmountAfterRelease01);

    expect(vestingBalanceBeforeRelease02.sub(vestingBalanceAfterRelease02)).to.equal(releasableAmountAfterRelease01);

    // do a loop with release for remaining months
    let releasableAmount = amount.div(24).mul(22);

    for (let i = 0; i < 22; i++) {
      await time.increase(30 * 24 * 60 * 60);
      await mine(1);

      const releasableAmountAfter = await vesting.getReleasableAmount(vestingId);

      expect(releasableAmountAfter).to.equal(ethers.utils.parseEther("50000"));

      const holderBalanceBefore = await token.balanceOf(firstHolder?.address);
      const vestingBalanceBefore = await token.balanceOf(vesting.address);

      const amountToRelease = releasableAmountAfter;

      const releaseTrx = await vesting.connect(firstHolder).release(vestingId, amountToRelease);

      await releaseTrx.wait();

      const holderBalanceAfter = await token.balanceOf(firstHolder?.address);

      const vestingBalanceAfter = await token.balanceOf(vesting.address);

      expect(holderBalanceAfter.sub(holderBalanceBefore)).to.equal(amountToRelease);

      expect(vestingBalanceBefore.sub(vestingBalanceAfter)).to.equal(amountToRelease);

      releasableAmount = releasableAmount.sub(amountToRelease);
    }

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);
  });

  it("Add vesting to seed round holder", async function () {
    // Seed Round: 10% (50 million XPP)
    // Seed Round: 5% unlocked at Token Generation Event (TGE), a 6-month cliff, then linear vesting over 12 months. 
    const { token, vesting, owner, tokenHolder, seedRoundHolder } = await loadFixture(deployFunction);

    const amount = ethers.utils.parseEther("50000000");

    // transfer 50 million XPP from tokenHolder to owner
    await token.connect(tokenHolder).transfer(owner?.address, amount);

    // 5% of 50 million XPP = 2.5 million XPP
    const amountToTransferAtTGE = ethers.utils.parseEther("2500000");

    // transfer 2.5 million XPP to seed round holder
    await token.connect(owner).transfer(seedRoundHolder?.address, amountToTransferAtTGE);

    const amountToVest = amount.sub(amountToTransferAtTGE);

    // beneficiary address
    const beneficiary = seedRoundHolder?.address;

    // start time =0(current time)
    const startTime = 0;

    // cliff duration (6 months)
    const cliffDuration = time.duration.days(180);

    // duration (12 months)
    const duration = time.duration.days(360);

    // revocable (true)
    const revocable = true;

    // slice period (1 month)
    const slicePeriod = time.duration.days(30);

    // approve token to vesting contract
    await token.connect(owner).approve(vesting.address, amountToVest);

    await vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amountToVest,
    );

    const scheduleCount = await vesting.getVestingSchedulesCount();

    expect(scheduleCount).to.equal(1);

    const vestingAmount = await vesting.getVestingSchedulesTotalAmount();

    expect(vestingAmount).to.equal(amountToVest);
  });

  it("Add vesting to private sale holder", async function () {
    // Private Sale: 15% (75 million XPP)
    // Private Sale: 7.5% unlocked at TGE, a 3-month cliff, then linear vesting over 10 months.
    const { token, vesting, owner, tokenHolder, privateSaleHolder } = await loadFixture(deployFunction);

    const amount = ethers.utils.parseEther("75000000");

    // transfer 75 million XPP from tokenHolder to owner
    await token.connect(tokenHolder).transfer(owner?.address, amount);

    // 7.5% of 75 million XPP = 5.625 million XPP
    const amountToTransferAtTGE = ethers.utils.parseEther("5625000");

    // transfer 5.625 million XPP to private sale holder
    await token.connect(owner).transfer(privateSaleHolder?.address, amountToTransferAtTGE);

    const amountToVest = amount.sub(amountToTransferAtTGE);

    // beneficiary address
    const beneficiary = privateSaleHolder?.address;

    // start time =0(current time)
    const startTime = 0;

    // cliff duration (3 months)
    const cliffDuration = time.duration.days(90);

    // duration (10 months)
    const duration = time.duration.days(300);

    // revocable (true)
    const revocable = true;

    // slice period (1 month)
    const slicePeriod = time.duration.days(30);

    // approve token to vesting contract
    await token.connect(owner).approve(vesting.address, amountToVest);

    await vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amountToVest,
    );
  });

  it("Add vesting to public presale holder", async function () {
    // Public Presale: 10% (50 million XPP)
    // Public Presale: 10% unlocked at TGE, a 3-month cliff, then linear vesting over 10 months.  
    const { token, vesting, owner, tokenHolder, publicPresaleHolder } = await loadFixture(deployFunction);

    const vestingAmountBefore = await vesting.getVestingSchedulesTotalAmount();

    const amount = ethers.utils.parseEther("50000000");

    // transfer 50 million XPP from tokenHolder to owner
    await token.connect(tokenHolder).transfer(owner?.address, amount);

    // 10% of 50 million XPP = 5 million XPP
    const amountToTransferAtTGE = ethers.utils.parseEther("5000000");

    // transfer 5 million XPP to public presale holder
    await token.connect(owner).transfer(publicPresaleHolder?.address, amountToTransferAtTGE);

    const amountToVest = amount.sub(amountToTransferAtTGE);

    // beneficiary address
    const beneficiary = publicPresaleHolder?.address;

    // start time =0(current time)
    const startTime = 0;

    // cliff duration (3 months)
    const cliffDuration = time.duration.days(90);

    // duration (10 months)
    const duration = time.duration.days(300);

    // revocable (true)
    const revocable = true;

    // slice period (1 month)
    const slicePeriod = time.duration.days(30);

    // approve token to vesting contract
    await token.connect(owner).approve(vesting.address, amountToVest);

    await vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amountToVest,
    );

    const scheduleCount = await vesting.getVestingSchedulesCount();

    expect(scheduleCount).to.equal(3);

    const vestingAmount = await vesting.getVestingSchedulesTotalAmount();

    expect(vestingAmount).to.equal(vestingAmountBefore.add(amountToVest));

    const totalVestingsForPublicPresaleHolder = await vesting.getVestingSchedulesCountForHolder(
      publicPresaleHolder?.address
    );

    expect(totalVestingsForPublicPresaleHolder).to.equal(1);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(publicPresaleHolder?.address, 0);

    const vestingSchedule = await vesting.getVestingSchedule(vestingId);

    expect(vestingSchedule.beneficiary).to.equal(publicPresaleHolder?.address);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);
  });

  it("Add vesting for liquidity holder", async function () {
    // Liquidity: 15% (75 million XPP)
    // Liquidity: 30% unlocked at TGE, then linear vesting over 12 months.

    const { token, vesting, owner, tokenHolder, liquidityHolder } = await loadFixture(deployFunction);

    const vestingAmountBefore = await vesting.getVestingSchedulesTotalAmount();

    const amount = ethers.utils.parseEther("75000000");

    // transfer 75 million XPP from tokenHolder to owner

    await token.connect(tokenHolder).transfer(owner?.address, amount);

    // 30% of 75 million XPP = 22.5 million XPP
    const amountToTransferAtTGE = ethers.utils.parseEther("22500000");

    // transfer 22.5 million XPP to liquidity holder

    await token.connect(owner).transfer(liquidityHolder?.address, amountToTransferAtTGE);

    const amountToVest = amount.sub(amountToTransferAtTGE);

    // beneficiary address
    const beneficiary = liquidityHolder?.address;

    // start time =0(current time)
    const startTime = 0;

    // cliff duration (0 months)
    const cliffDuration = 0;

    // duration (12 months)
    const duration = time.duration.days(360);

    // revocable (true)
    const revocable = true;

    // slice period (1 month)
    const slicePeriod = time.duration.days(30);

    // approve token to vesting contract
    await token.connect(owner).approve(vesting.address, amountToVest);

    await vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amountToVest,
    );

    // contract level vesting amount
    const vestingAmount = await vesting.getVestingSchedulesTotalAmount();

    expect(vestingAmount).to.equal(vestingAmountBefore.add(amountToVest));

    const totalVestings = await vesting.getVestingSchedulesCount();

    expect(totalVestings).to.equal(4);

    const totalVestingsForLiquidityHolder = await vesting.getVestingSchedulesCountForHolder(
      liquidityHolder?.address
    );

    expect(totalVestingsForLiquidityHolder).to.equal(1);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(liquidityHolder?.address, 0);

    const vestingSchedule = await vesting.getVestingSchedule(vestingId);

    expect(vestingSchedule.beneficiary).to.equal(liquidityHolder?.address);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);
  });

  it("Add vesting for marketing holder", async function () {
    // Marketing and KOLs: 10% (50 million XPP)
    // Marketing/KOL: Linear vesting over 36 months.

    const { token, vesting, owner, tokenHolder, marketingHolder } = await loadFixture(deployFunction);

    const vestingAmountBefore = await vesting.getVestingSchedulesTotalAmount();

    const amount = ethers.utils.parseEther("50000000");

    // transfer 50 million XPP from tokenHolder to owner

    await token.connect(tokenHolder).transfer(owner?.address, amount);

    // beneficiary address
    const beneficiary = marketingHolder?.address;

    // start time =0(current time)
    const startTime = 0;

    // cliff duration (0 months) 
    const cliffDuration = 0;

    // duration (36 months)
    const duration = time.duration.days(1080);

    // revocable (true)
    const revocable = true;

    // slice period (1 month)
    const slicePeriod = time.duration.days(30);

    // approve token to vesting contract
    await token.connect(owner).approve(vesting.address, amount);

    await vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amount,
    );

    // contract level vesting amount
    const vestingAmount = await vesting.getVestingSchedulesTotalAmount();

    expect(vestingAmount).to.equal(vestingAmountBefore.add(amount));

    const totalVestings = await vesting.getVestingSchedulesCount();

    expect(totalVestings).to.equal(5);

    const totalVestingsForMarketingHolder = await vesting.getVestingSchedulesCountForHolder(
      marketingHolder?.address
    );

    expect(totalVestingsForMarketingHolder).to.equal(1);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(marketingHolder?.address, 0);

    const vestingSchedule = await vesting.getVestingSchedule(vestingId);

    expect(vestingSchedule.beneficiary).to.equal(marketingHolder?.address);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);

    const totalVestingAmountForMarketingHolder = await vesting.getTotalVestingAmountForHolder(
      marketingHolder?.address
    );

    expect(totalVestingAmountForMarketingHolder).to.equal(amount);
  });

  it("Add vesting for team holder", async function () {
    // Partnerships: 5% (25 million XPP)
    // Team and Advisors: 12-month cliff, then linear vesting over 36 months. 
    const { token, vesting, owner, tokenHolder, teamHolder } = await loadFixture(deployFunction);

    const vestingAmountBefore = await vesting.getVestingSchedulesTotalAmount();

    const amount = ethers.utils.parseEther("25000000");

    // transfer 25 million XPP from tokenHolder to owner

    await token.connect(tokenHolder).transfer(owner?.address, amount);

    // beneficiary address

    const beneficiary = teamHolder?.address;

    // start time =0(current time)

    const startTime = 0;

    // cliff duration (12 months)

    const cliffDuration = time.duration.days(360);

    // duration (36 months)

    const duration = time.duration.days(1080);

    // revocable (true)

    const revocable = true;

    // slice period (1 month)

    const slicePeriod = time.duration.days(30);

    // approve token to vesting contract

    await token.connect(owner).approve(vesting.address, amount);

    await vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amount,
    );

    // contract level vesting amount

    const vestingAmount = await vesting.getVestingSchedulesTotalAmount();

    expect(vestingAmount).to.equal(vestingAmountBefore.add(amount));

    const totalVestings = await vesting.getVestingSchedulesCount();

    expect(totalVestings).to.equal(6);

    const totalVestingsForTeamHolder = await vesting.getVestingSchedulesCountForHolder(
      teamHolder?.address
    );

    expect(totalVestingsForTeamHolder).to.equal(1);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(teamHolder?.address, 0);

    const vestingSchedule = await vesting.getVestingSchedule(vestingId);

    expect(vestingSchedule.beneficiary).to.equal(teamHolder?.address);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);
  });

  it("Add vesting for staking reward holder", async function () {
    // Staking Rewards: 10% (50 million XPP)
    // Staking Reward: 1-month cliff, then linear vesting over 48 months.
    const { token, vesting, owner, tokenHolder, stakingRewardHolder } = await loadFixture(deployFunction);

    const vestingAmountBefore = await vesting.getVestingSchedulesTotalAmount();

    const amount = ethers.utils.parseEther("50000000");

    // transfer 50 million XPP from tokenHolder to owner

    await token.connect(tokenHolder).transfer(owner?.address, amount);

    // beneficiary address

    const beneficiary = stakingRewardHolder?.address;

    // start time =0(current time)

    const startTime = 0;

    // cliff duration (1 months)

    const cliffDuration = time.duration.days(30);

    // duration (48 months)

    const duration = time.duration.days(1440);

    // revocable (true)

    const revocable = true;

    // slice period (1 month)

    const slicePeriod = time.duration.days(30);

    // approve token to vesting contract

    await token.connect(owner).approve(vesting.address, amount);

    await vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amount,
    );

    // contract level vesting amount

    const vestingAmount = await vesting.getVestingSchedulesTotalAmount();

    expect(vestingAmount).to.equal(vestingAmountBefore.add(amount));

    const totalVestings = await vesting.getVestingSchedulesCount();

    expect(totalVestings).to.equal(7);

    const totalVestingsForStakingRewardHolder = await vesting.getVestingSchedulesCountForHolder(
      stakingRewardHolder?.address
    );

    expect(totalVestingsForStakingRewardHolder).to.equal(1);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(stakingRewardHolder?.address, 0);

    const vestingSchedule = await vesting.getVestingSchedule(vestingId);

    expect(vestingSchedule.beneficiary).to.equal(stakingRewardHolder?.address);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);

    const totalVestingAmountForStakingRewardHolder = await vesting.getTotalVestingAmountForHolder(
      stakingRewardHolder?.address
    );

    expect(totalVestingAmountForStakingRewardHolder).to.equal(amount);
  });

  it("Add vesting for ecosystem holder", async function () {
    // Ecosystem Rewards: 5% (25 million XPP)
    // Ecosystem Reward: Linear vesting over 48 months.
    const { token, vesting, owner, tokenHolder, ecosystemHolder } = await loadFixture(deployFunction);

    const vestingAmountBefore = await vesting.getVestingSchedulesTotalAmount();

    const amount = ethers.utils.parseEther("25000000");

    // transfer 25 million XPP from tokenHolder to owner

    await token.connect(tokenHolder).transfer(owner?.address, amount);

    // beneficiary address

    const beneficiary = ecosystemHolder?.address;

    // start time =0(current time)

    const startTime = 0;

    // cliff duration (0 months)

    const cliffDuration = 0;

    // duration (48 months)

    const duration = time.duration.days(1440);

    // revocable (true)

    const revocable = true;

    // slice period (1 month)

    const slicePeriod = time.duration.days(30);

    // approve token to vesting contract

    await token.connect(owner).approve(vesting.address, amount);

    await vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amount,
    );

    // contract level vesting amount

    const vestingAmount = await vesting.getVestingSchedulesTotalAmount();

    expect(vestingAmount).to.equal(vestingAmountBefore.add(amount));

    const totalVestings = await vesting.getVestingSchedulesCount();

    expect(totalVestings).to.equal(8);

    const totalVestingsForEcosystemHolder = await vesting.getVestingSchedulesCountForHolder(
      ecosystemHolder?.address
    );

    expect(totalVestingsForEcosystemHolder).to.equal(1);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(ecosystemHolder?.address, 0);

    const vestingSchedule = await vesting.getVestingSchedule(vestingId);

    expect(vestingSchedule.beneficiary).to.equal(ecosystemHolder?.address);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);

    const totalVestingAmountForEcosystemHolder = await vesting.getTotalVestingAmountForHolder(
      ecosystemHolder?.address
    );

    expect(totalVestingAmountForEcosystemHolder).to.equal(amount);
  });

  it("Add vesting for airdrop holder", async function () {
    // Airdrop: 1% (5 million XPP)
    // Airdrop: Linear vesting over 48 months.

    const { token, vesting, owner, tokenHolder, airdropHolder } = await loadFixture(deployFunction);

    const vestingAmountBefore = await vesting.getVestingSchedulesTotalAmount();

    const amount = ethers.utils.parseEther("5000000");

    // transfer 5 million XPP from tokenHolder to owner

    await token.connect(tokenHolder).transfer(owner?.address, amount);

    // beneficiary address

    const beneficiary = airdropHolder?.address;

    // start time =0(current time)

    const startTime = 0;

    // cliff duration (0 months)

    const cliffDuration = 0;

    // duration (48 months)

    const duration = time.duration.days(1440);

    // revocable (true)

    const revocable = true;

    // slice period (1 month)

    const slicePeriod = time.duration.days(30);

    // approve token to vesting contract

    await token.connect(owner).approve(vesting.address, amount);

    await vesting.connect(owner).createVestingSchedule(
      beneficiary,
      startTime,
      cliffDuration,
      duration,
      slicePeriod,
      revocable,
      amount,
    );

    // contract level vesting amount

    const vestingAmount = await vesting.getVestingSchedulesTotalAmount();

    expect(vestingAmount).to.equal(vestingAmountBefore.add(amount));

    const totalVestings = await vesting.getVestingSchedulesCount();

    expect(totalVestings).to.equal(9);

    const totalVestingsForAirdropHolder = await vesting.getVestingSchedulesCountForHolder(
      airdropHolder?.address
    );

    expect(totalVestingsForAirdropHolder).to.equal(1);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(airdropHolder?.address, 0);

    const vestingSchedule = await vesting.getVestingSchedule(vestingId);

    expect(vestingSchedule.beneficiary).to.equal(airdropHolder?.address);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);
  });

  it("Forward time to 1 month", async function () {
    await time.increase(30 * 24 * 60 * 60);
    await mine(1);
  });

  it("Check vesting release amount for seed round holders after 1 month", async function () {
    const { vesting, seedRoundHolder } = await loadFixture(deployFunction);

    const totalVestingsForSeedRoundHolder = await vesting.getVestingSchedulesCountForHolder(
      seedRoundHolder?.address
    );

    expect(totalVestingsForSeedRoundHolder).to.equal(1);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(seedRoundHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmount).to.equal(0);
  });

  it("Check vesting release amount for private sale holders after 1 month", async function () {
    const { vesting, privateSaleHolder } = await loadFixture(deployFunction);

    const totalVestingsForPrivateSaleHolder = await vesting.getVestingSchedulesCountForHolder(
      privateSaleHolder?.address
    );

    expect(totalVestingsForPrivateSaleHolder).to.equal(1);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(privateSaleHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmount).to.equal(0);
  });

  it("Forward time to 12th month", async function () {
    await time.increase(11 * 30 * 24 * 60 * 60);
    await mine(1);
  });

  it("Check vesting release amount for seed round holders after 12 months", async function () {
    const { vesting, seedRoundHolder } = await loadFixture(deployFunction);

    const totalVestingsForSeedRoundHolder = await vesting.getVestingSchedulesCountForHolder(
      seedRoundHolder?.address
    );

    expect(totalVestingsForSeedRoundHolder).to.equal(1);

    const totalVestingAmountForSeedRoundHolder = await vesting.getTotalVestingAmountForHolder(
      seedRoundHolder?.address
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(seedRoundHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmount).to.equal(totalVestingAmountForSeedRoundHolder?.div(2));
  });

  it("Check vesting release amount for private sale holders after 12 months", async function () {
    const { vesting, privateSaleHolder } = await loadFixture(deployFunction);

    const totalVestingsForPrivateSaleHolder = await vesting.getVestingSchedulesCountForHolder(
      privateSaleHolder?.address
    );

    expect(totalVestingsForPrivateSaleHolder).to.equal(1);

    const totalVestingAmountForPrivateSaleHolder = await vesting.getTotalVestingAmountForHolder(
      privateSaleHolder?.address
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(privateSaleHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmount).to.equal(totalVestingAmountForPrivateSaleHolder?.mul(9).div(10));
  });

  it("Release from seed round holder after 12 months", async function () {
    const { token, vesting, seedRoundHolder } = await loadFixture(deployFunction);

    const totalVestingsForSeedRoundHolder = await vesting.getVestingSchedulesCountForHolder(
      seedRoundHolder?.address
    );

    expect(totalVestingsForSeedRoundHolder).to.equal(1);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(seedRoundHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    const holderBalanceBefore = await token.balanceOf(seedRoundHolder?.address);
    const vestingBalanceBefore = await token.balanceOf(vesting.address);

    const releaseTrx = await vesting.connect(seedRoundHolder).release(vestingId, releasableAmount);

    await releaseTrx.wait();

    const holderBalanceAfter = await token.balanceOf(seedRoundHolder?.address);
    const vestingBalanceAfter = await token.balanceOf(vesting.address);

    expect(holderBalanceAfter.sub(holderBalanceBefore)).to.equal(releasableAmount);

    expect(vestingBalanceBefore.sub(vestingBalanceAfter)).to.equal(releasableAmount);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);
  });

  it("Release from private sale holder after 12 months", async function () {
    const { token, vesting, privateSaleHolder } = await loadFixture(deployFunction);

    const totalVestingAmountForPrivateSaleHolder = await vesting.getTotalVestingAmountForHolder(
      privateSaleHolder?.address
    );

    // 75 million XPP - 5.625 million XPP = 69.375 million XPP
    expect(totalVestingAmountForPrivateSaleHolder).to.equal(
      ethers.utils.parseEther("69375000")
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(privateSaleHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    const holderBalanceBefore = await token.balanceOf(privateSaleHolder?.address);

    const vestingBalanceBefore = await token.balanceOf(vesting.address);

    const releaseTrx = await vesting.connect(privateSaleHolder).release(vestingId, releasableAmount);

    await releaseTrx.wait();

    const holderBalanceAfter = await token.balanceOf(privateSaleHolder?.address);

    const vestingBalanceAfter = await token.balanceOf(vesting.address);

    expect(holderBalanceAfter.sub(holderBalanceBefore)).to.equal(releasableAmount);

    expect(vestingBalanceBefore.sub(vestingBalanceAfter)).to.equal(releasableAmount);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);

    const totalVestingAmountForPrivateSaleHolderAfterRelease = await vesting.getTotalVestingAmountForHolder(
      privateSaleHolder?.address
    );

    expect(totalVestingAmountForPrivateSaleHolderAfterRelease).to.equal(
      totalVestingAmountForPrivateSaleHolder
    );
  });

  it("Forward time to 24th month", async function () {
    await time.increase(12 * 30 * 24 * 60 * 60);
    await mine(1);
  });

  it("Check vesting release amount for seed round holders after 24 months", async function () {
    const { vesting, seedRoundHolder } = await loadFixture(deployFunction);

    const totalVestingsForSeedRoundHolder = await vesting.getVestingSchedulesCountForHolder(
      seedRoundHolder?.address
    );

    expect(totalVestingsForSeedRoundHolder).to.equal(1);

    const totalVestingAmountForSeedRoundHolder = await vesting.getTotalVestingAmountForHolder(
      seedRoundHolder?.address
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(seedRoundHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmount).to.equal(totalVestingAmountForSeedRoundHolder.div(2));
  });

  it("Check vesting release amount for private sale holders after 24 months", async function () {
    const { vesting, privateSaleHolder } = await loadFixture(deployFunction);

    const totalVestingsForPrivateSaleHolder = await vesting.getVestingSchedulesCountForHolder(
      privateSaleHolder?.address
    );

    expect(totalVestingsForPrivateSaleHolder).to.equal(1);

    const totalVestingAmountForPrivateSaleHolder = await vesting.getTotalVestingAmountForHolder(
      privateSaleHolder?.address
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(privateSaleHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmount).to.equal(totalVestingAmountForPrivateSaleHolder.div(10));
  });

  it("Release from seed round holder after 24 months", async function () {
    const { token, vesting, seedRoundHolder } = await loadFixture(deployFunction);

    const totalVestingAmountForSeedRoundHolder = await vesting.getTotalVestingAmountForHolder(
      seedRoundHolder?.address
    );

    // 50 million XPP - 2.5 million XPP = 47.5 million XPP
    expect(totalVestingAmountForSeedRoundHolder).to.equal(
      ethers.utils.parseEther("47500000")
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(seedRoundHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    const holderBalanceBefore = await token.balanceOf(seedRoundHolder?.address);
    const vestingBalanceBefore = await token.balanceOf(vesting.address);

    const releaseTrx = await vesting.connect(seedRoundHolder).release(vestingId, releasableAmount);

    await releaseTrx.wait();

    const holderBalanceAfter = await token.balanceOf(seedRoundHolder?.address);
    const vestingBalanceAfter = await token.balanceOf(vesting.address);

    expect(holderBalanceAfter.sub(holderBalanceBefore)).to.equal(releasableAmount);

    expect(vestingBalanceBefore.sub(vestingBalanceAfter)).to.equal(releasableAmount);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);
  });

  it("Release from private sale holder after 24 months", async function () {
    const { token, vesting, privateSaleHolder } = await loadFixture(deployFunction);

    const totalVestingAmountForPrivateSaleHolder = await vesting.getTotalVestingAmountForHolder(
      privateSaleHolder?.address
    );

    // 75 million XPP - 5.625 million XPP = 69.375 million XPP
    expect(totalVestingAmountForPrivateSaleHolder).to.equal(
      ethers.utils.parseEther("69375000")
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(privateSaleHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    const holderBalanceBefore = await token.balanceOf(privateSaleHolder?.address);
    const vestingBalanceBefore = await token.balanceOf(vesting.address);

    const releaseTrx = await vesting.connect(privateSaleHolder).release(vestingId, releasableAmount);

    await releaseTrx.wait();

    const holderBalanceAfter = await token.balanceOf(privateSaleHolder?.address);
    const vestingBalanceAfter = await token.balanceOf(vesting.address);

    expect(holderBalanceAfter.sub(holderBalanceBefore)).to.equal(releasableAmount);

    expect(vestingBalanceBefore.sub(vestingBalanceAfter)).to.equal(releasableAmount);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);
  });

  it("Forward to 36th months", async function () {
    await time.increase(12 * 30 * 24 * 60 * 60);
    await mine(1);
  });

  it("Check vesting release amount for seed round holders after 36 months", async function () {
    const { vesting, seedRoundHolder } = await loadFixture(deployFunction);

    const totalVestingsForSeedRoundHolder = await vesting.getVestingSchedulesCountForHolder(
      seedRoundHolder?.address
    );

    expect(totalVestingsForSeedRoundHolder).to.equal(1);

    const totalVestingAmountForSeedRoundHolder = await vesting.getTotalVestingAmountForHolder(
      seedRoundHolder?.address
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(seedRoundHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmount).to.equal(0);
  });

  it("Check vesting release amount for private sale holders after 36 months", async function () {
    const { vesting, privateSaleHolder } = await loadFixture(deployFunction);

    const totalVestingAmountForPrivateSaleHolder = await vesting.getTotalVestingAmountForHolder(
      privateSaleHolder?.address
    );

    // 75 million XPP - 5.625 million XPP = 69.375 million XPP
    expect(totalVestingAmountForPrivateSaleHolder).to.equal(
      ethers.utils.parseEther("69375000")
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(privateSaleHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmount).to.equal(0);
  });

  it("Should fail: release from seed round holder after 36 months", async function () {
    const { vesting, seedRoundHolder } = await loadFixture(deployFunction);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(seedRoundHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    await expect(vesting.connect(seedRoundHolder).release(vestingId, releasableAmount)).to.be.revertedWith(
      "TokenVesting: cannot release tokens, not enough vested tokens"
    );
  });

  it("Should fail: release from private sale holder after 36 months", async function () {
    const { vesting, privateSaleHolder } = await loadFixture(deployFunction);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(privateSaleHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    await expect(vesting.connect(privateSaleHolder).release(vestingId, releasableAmount.add(ethers.utils.parseEther("10000")))).to.be.revertedWith(
      "TokenVesting: cannot release tokens, not enough vested tokens"
    );
  });

  it("Check vesting release amount for airdrop holder", async function () {
    const { vesting, airdropHolder } = await loadFixture(deployFunction);

    const totalVestingAmountForAirdropHolder = await vesting.getTotalVestingAmountForHolder(
      airdropHolder?.address
    );

    // 5 million XPP
    expect(totalVestingAmountForAirdropHolder).to.equal(
      ethers.utils.parseEther("5000000")
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(airdropHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmount).to.equal(totalVestingAmountForAirdropHolder.mul(36).div(48));
  });

  it("Release from airdrop holder", async function () {
    const { token, vesting, airdropHolder } = await loadFixture(deployFunction);

    const totalVestingAmountForAirdropHolder = await vesting.getTotalVestingAmountForHolder(
      airdropHolder?.address
    );

    // 5 million XPP
    expect(totalVestingAmountForAirdropHolder).to.equal(
      ethers.utils.parseEther("5000000")
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(airdropHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    const holderBalanceBefore = await token.balanceOf(airdropHolder?.address);
    const vestingBalanceBefore = await token.balanceOf(vesting.address);

    const releaseTrx = await vesting.connect(airdropHolder).release(vestingId, releasableAmount);

    await releaseTrx.wait();

    const holderBalanceAfter = await token.balanceOf(airdropHolder?.address);
    const vestingBalanceAfter = await token.balanceOf(vesting.address);

    expect(holderBalanceAfter.sub(holderBalanceBefore)).to.equal(releasableAmount);

    expect(vestingBalanceBefore.sub(vestingBalanceAfter)).to.equal(releasableAmount);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);
  });

  it("Forward 15 days", async function () {
    await time.increase(15 * 24 * 60 * 60);
    await mine(1);
  });

  it("Check vesting release amount for airdrop holder after 15 days", async function () {
    const { vesting, airdropHolder } = await loadFixture(deployFunction);

    const totalVestingAmountForAirdropHolder = await vesting.getTotalVestingAmountForHolder(
      airdropHolder?.address
    );

    // 5 million XPP
    expect(totalVestingAmountForAirdropHolder).to.equal(
      ethers.utils.parseEther("5000000")
    );

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(airdropHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmount).to.equal(0);
  });

  it("Should Fail: Revoke vesting for seed round holder with nonOwner", async function () {
    const { vesting, seedRoundHolder } = await loadFixture(deployFunction);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(seedRoundHolder?.address, 0);

    await expect(vesting.connect(seedRoundHolder).revoke(vestingId)).to.be.revertedWith(
      `OwnableUnauthorized`
    );
  });


  it("Revoke vesting for ecosystem holder", async function () {
    const { owner, vesting, ecosystemHolder, token } = await loadFixture(deployFunction);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(ecosystemHolder?.address, 0);

    const withdrawableAmountBefore = await vesting.getWithdrawableAmount();

    const totalVestingAmountForEcosystemHolder = await vesting.getTotalVestingAmountForHolder(
      ecosystemHolder?.address
    );

    const totalVestingBefore = await vesting.getVestingSchedulesTotalAmount();

    const contractBalanceBefore = await token.balanceOf(vesting.address);

    const marketingHolderBalanceBefore = await token.balanceOf(ecosystemHolder?.address);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    const revokeTrx = await vesting.connect(owner).revoke(vestingId);

    await revokeTrx.wait();

    const totalVestingAfter = await vesting.getVestingSchedulesTotalAmount();

    const contractBalanceAfter = await token.balanceOf(vesting.address);

    const marketingHolderBalanceAfter = await token.balanceOf(ecosystemHolder?.address);

    expect(totalVestingBefore.sub(totalVestingAfter)).to.equal(totalVestingAmountForEcosystemHolder);

    expect(contractBalanceBefore.sub(contractBalanceAfter)).to.equal(releasableAmount);

    expect(marketingHolderBalanceAfter.sub(marketingHolderBalanceBefore)).to.equal(releasableAmount);

    expect(await vesting.getReleasableAmount(vestingId)).to.equal(0);

    expect(await vesting.getWithdrawableAmount()).to.be.equal(
      totalVestingBefore.sub(totalVestingAfter).sub(releasableAmount).add(withdrawableAmountBefore)
    );
  });

  it("Forward 15 days", async function () {
    await time.increase(15 * 24 * 60 * 60);
    await mine(1);
  });

  it("Releasable amount for ecosystem holder after 15 days", async function () {
    const { vesting, ecosystemHolder } = await loadFixture(deployFunction);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(ecosystemHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    expect(releasableAmount).to.equal(0);
  });

  it("Should Fail: Release from revoked ecosystem holder", async function () {
    const { vesting, ecosystemHolder } = await loadFixture(deployFunction);

    const vestingId = await vesting.getVestingScheduleIdForHolderAndIndex(ecosystemHolder?.address, 0);

    const releasableAmount = await vesting.getReleasableAmount(vestingId);

    await expect(vesting.connect(ecosystemHolder).release(vestingId, releasableAmount.add(ethers.utils.parseEther("1000")))).to.be.revertedWith(
      "TokenVesting: vesting is revoked"
    );
  });

  it("Should Fail: Withdraw from non-owner", async function () {
    const { vesting, ecosystemHolder } = await loadFixture(deployFunction);

    const amountToWithdraw = ethers.utils.parseEther("1000");

    await expect(vesting.connect(ecosystemHolder).withdraw(amountToWithdraw)).to.be.revertedWith(
      `OwnableUnauthorized`
    );
  });

  it("Should Fail: withdraw more than withdrawable amount", async function () {
    const { vesting, owner } = await loadFixture(deployFunction);

    const withdrawableAmount = await vesting.getWithdrawableAmount();
    const amountToWithdraw = withdrawableAmount.add(ethers.utils.parseEther("1000"));

    await expect(vesting.connect(owner).withdraw(
      amountToWithdraw
    )).to.be.revertedWith(
      "TokenVesting: not enough withdrawable funds"
    );
  });

  it("Withdraw from owner", async function () {
    const { vesting, owner, token } = await loadFixture(deployFunction);

    const withdrawableAmountBefore = await vesting.getWithdrawableAmount();

    const contractBalanceBefore = await token.balanceOf(vesting.address);

    const ownerBalanceBefore = await token.balanceOf(owner?.address);

    const withdrawableAmount = await vesting.getWithdrawableAmount();

    const withdrawTrx = await vesting.connect(owner).withdraw(withdrawableAmount);

    await withdrawTrx.wait();

    const withdrawableAmountAfter = await vesting.getWithdrawableAmount();

    const contractBalanceAfter = await token.balanceOf(vesting.address);

    const ownerBalanceAfter = await token.balanceOf(owner?.address);

    expect(withdrawableAmountAfter).to.equal(0);

    expect(contractBalanceBefore.sub(contractBalanceAfter)).to.equal(withdrawableAmount);

    expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.equal(withdrawableAmount);

    expect(await vesting.getWithdrawableAmount()).to.equal(0);
  });

});
