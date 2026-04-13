// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PayrollRegistry} from "../src/PayrollRegistry.sol";
import {FlowWageFactory} from "../src/FlowWageFactory.sol";
import {StreamVault} from "../src/StreamVault.sol";
import {MockUSDT} from "../src/mocks/MockUSDT.sol";
import {IPayrollRegistry} from "../src/interfaces/IFlowWage.sol";

contract FlowWageTest is Test {
    PayrollRegistry internal registry;
    FlowWageFactory internal factory;
    MockUSDT internal usdt;

    address internal admin = address(0xA11CE);
    address internal employer = address(0xE1);
    address internal employee = address(0xE2);

    function setUp() external {
        vm.prank(admin);
        registry = new PayrollRegistry(admin);

        vm.startPrank(admin);
        registry.grantRole(registry.KYC_MANAGER_ROLE(), admin);
        registry.grantRole(registry.PAUSER_ROLE(), admin);
        registry.registerEmployer(employer);
        registry.setKYCStatus(employee, IPayrollRegistry.KYCStatus.Approved);
        usdt = new MockUSDT();
        registry.whitelistToken(address(usdt));
        factory = new FlowWageFactory(address(registry), admin);
        vm.stopPrank();

        usdt.mint(employer, 1_000_000 * 1e6);
    }

    function testRegistryAndFactoryDeployVault() external {
        vm.prank(employer);
        address predicted = factory.computeVaultAddress(employer);

        vm.prank(employer);
        address deployed = factory.deployVault();
        assertEq(deployed, predicted);

        vm.prank(employer);
        vm.expectRevert();
        factory.deployVault();
    }

    function testCreateWithdrawPauseResumeCancel() external {
        vm.prank(employer);
        address vaultAddress = factory.deployVault();
        StreamVault vault = StreamVault(vaultAddress);

        vm.startPrank(employer);
        usdt.approve(vaultAddress, type(uint256).max);
        uint256 start = block.timestamp + 1 days;
        uint256 end = start + 30 days;

        uint256 streamId = vault.createStream(
            StreamVault.StreamParams({
                employee: employee,
                token: address(usdt),
                totalDeposit: 3_000 * 1e6,
                startTime: start,
                endTime: end
            })
        );
        vm.stopPrank();

        assertEq(vault.claimableBalance(streamId), 0);

        vm.warp(start + 15 days);
        uint256 halfway = vault.claimableBalance(streamId);
        assertGt(halfway, 0);

        vm.prank(employee);
        vault.withdraw(streamId, halfway / 2, employee);

        vm.prank(employer);
        vault.pauseStream(streamId);

        vm.warp(block.timestamp + 1 days);

        vm.prank(employer);
        vault.resumeStream(streamId);

        vm.warp(end + 20 days);
        vm.prank(employee);
        vault.withdrawAll(streamId, employee);

        vm.prank(employer);
        vm.expectRevert();
        vault.createStream(
            StreamVault.StreamParams({
                employee: employee,
                token: address(usdt),
                totalDeposit: 20_000_000 * 1e6,
                startTime: block.timestamp + 1 days,
                endTime: block.timestamp + 2 days
            })
        );
    }
}
